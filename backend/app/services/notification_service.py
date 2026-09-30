"""Appointment confirmations. Provider acceptance is not proof of delivery."""
import base64
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
import json
import os
import smtplib
import ssl
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.database import get_connection


class NotConfigured(Exception):
    pass


def confirmation_text(appointment):
    # Appointment timestamps are supplied by the browser as ISO UTC values.
    when = datetime.fromisoformat(appointment['starts_at'].replace('Z', '+00:00'))
    if when.tzinfo is None:
        raise ValueError('Appointment time must include a timezone')
    when = when.astimezone(timezone(timedelta(hours=2)))
    return (
        f"MediQueue: your appointment is confirmed for {when:%d %b %Y at %H:%M} SAST. "
        f"Location: {appointment['location']}. "
        "Please bring your identification and hospital documents."
    )


def send_sms(recipient, body):
    account = os.getenv('TWILIO_ACCOUNT_SID', '')
    token = os.getenv('TWILIO_AUTH_TOKEN', '')
    sender = os.getenv('TWILIO_FROM_NUMBER', '')
    if not all((account, token, sender)):
        raise NotConfigured()
    authorization = base64.b64encode(f'{account}:{token}'.encode()).decode()
    request = Request(
        f'https://api.twilio.com/2010-04-01/Accounts/{account}/Messages.json',
        data=urlencode({'To': recipient, 'From': sender, 'Body': body}).encode(),
        headers={'Authorization': f'Basic {authorization}',
                 'Content-Type': 'application/x-www-form-urlencoded'},
        method='POST',
    )
    with urlopen(request, timeout=10) as response:
        result = json.load(response)
    if result.get('status') in ('failed', 'undelivered', 'canceled'):
        return 'failed', result.get('sid', '')
    if not result.get('sid'):
        return 'unknown', ''
    return 'accepted', result['sid']


def send_email(recipient, body):
    host = os.getenv('SMTP_HOST', '')
    sender = os.getenv('SMTP_FROM', '')
    if not host or not sender:
        raise NotConfigured()
    mode = os.getenv('SMTP_SECURITY', 'starttls')
    if mode not in ('starttls', 'ssl'):
        raise NotConfigured()
    port = int(os.getenv('SMTP_PORT', '465' if mode == 'ssl' else '587'))
    message = EmailMessage()
    message['From'] = sender
    message['To'] = recipient
    message['Subject'] = 'MediQueue appointment confirmation'
    message.set_content(body)
    context = ssl.create_default_context()
    client = (smtplib.SMTP_SSL(host, port, timeout=10, context=context)
              if mode == 'ssl' else smtplib.SMTP(host, port, timeout=10))
    with client as smtp:
        if mode == 'starttls':
            smtp.starttls(context=context)
        username = os.getenv('SMTP_USERNAME', '')
        if username:
            smtp.login(username, os.getenv('SMTP_PASSWORD', ''))
        refused = smtp.send_message(message)
    return ('failed' if refused else 'accepted'), ''


def notification_statuses(appointment_id):
    with get_connection() as connection:
        rows = connection.execute(
            'SELECT channel, status FROM appointment_notifications WHERE appointment_id = ?',
            (appointment_id,),
        ).fetchall()
    return {row['channel']: row['status'] for row in rows}


def _send_channel(appointment_id, channel, body):
    # Claim before sending: repeated requests never send a second message.
    with get_connection() as connection:
        claimed = connection.execute(
            "UPDATE appointment_notifications SET status = 'sending' WHERE appointment_id = ? AND channel = ? AND status = 'pending'",
            (appointment_id, channel),
        ).rowcount
        if not claimed:
            return
        row = connection.execute(
            'SELECT recipient FROM appointment_notifications WHERE appointment_id = ? AND channel = ?',
            (appointment_id, channel),
        ).fetchone()
    provider_id = ''
    try:
        sender = send_sms if channel == 'sms' else send_email
        status, provider_id = sender(row['recipient'], body)
    except NotConfigured:
        status = 'not_configured'
    except (HTTPError, smtplib.SMTPResponseException):
        status = 'failed'
    except Exception:
        # A timeout can happen after acceptance. Never retry automatically.
        status = 'unknown'
    with get_connection() as connection:
        connection.execute(
            'UPDATE appointment_notifications SET status = ?, provider_id = ? WHERE appointment_id = ? AND channel = ?',
            (status, provider_id, appointment_id, channel),
        )


def send_confirmations(appointment):
    body = confirmation_text(appointment)
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(_send_channel, appointment['id'], channel, body)
                   for channel in ('sms', 'email')]
        for future in futures:
            future.result()
