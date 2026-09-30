import re


def normalize_mobile(value):
    number = re.sub(r'[\s()\-]', '', value)
    if re.fullmatch(r'0\d{9}', number):
        number = '+27' + number[1:]
    if not re.fullmatch(r'\+[1-9]\d{7,14}', number):
        raise ValueError('Enter a valid mobile number, such as 0821234567 or +27821234567.')
    return number
