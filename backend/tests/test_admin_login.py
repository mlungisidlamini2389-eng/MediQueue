import os
import gc
from http.cookies import SimpleCookie
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from fastapi import HTTPException, Response
from pydantic import ValidationError
from app import database
from app.routers.auth import admin_login, get_current_user, login, logout, register
from app.schemas.user import AdminLoginRequest, LoginRequest, RegisterRequest


class AdminLoginTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.env = patch.dict(os.environ, {}, clear=True)
        self.env.start()
        self.addCleanup(self.env.stop)
        self.path = patch.object(database, "DATABASE_PATH", Path(self.temp.name) / "test.db")
        self.path.start()
        self.addCleanup(self.path.stop)
        self.addCleanup(gc.collect)
        database.initialize_database()

    def test_admin_login_restores_and_revokes_session(self):
        response = Response()
        result = admin_login(AdminLoginRequest(password='Admin@'), response)
        self.assertEqual(result.user.role, 'admin')
        cookie = SimpleCookie(response.headers['set-cookie'])['mediqueue_session']
        self.assertTrue(cookie['httponly'])
        self.assertEqual(get_current_user(cookie.value).role, 'admin')
        logout(Response(), cookie.value)
        with self.assertRaises(HTTPException) as error:
            get_current_user(cookie.value)
        self.assertEqual(error.exception.status_code, 401)

    def test_wrong_and_missing_password_do_not_create_session(self):
        response = Response()
        with self.assertRaises(HTTPException) as error:
            admin_login(AdminLoginRequest(password='admin@'), response)
        self.assertEqual(error.exception.status_code, 401)
        self.assertNotIn('set-cookie', response.headers)
        for payload in [{}, {'password': ''}]:
            with self.assertRaises(ValidationError):
                AdminLoginRequest(**payload)

    def test_configured_password_overrides_default(self):
        with patch.dict(os.environ, {'MEDIQUEUE_ADMIN_PASSWORD': 'custom-test-password'}):
            database.initialize_database()
            with self.assertRaises(HTTPException):
                admin_login(AdminLoginRequest(password='Admin@'), Response())
            result = admin_login(AdminLoginRequest(password='custom-test-password'), Response())
            self.assertEqual(result.user.role, 'admin')

    def test_patient_password_cannot_authenticate_as_admin(self):
        register(RegisterRequest(name='Test Patient', email='patient@example.com', password='patient-secret'), Response())
        with self.assertRaises(HTTPException) as error:
            admin_login(AdminLoginRequest(password='patient-secret'), Response())
        self.assertEqual(error.exception.status_code, 401)
        result = login(LoginRequest(email='patient@example.com', password='patient-secret'), Response())
        self.assertEqual(result.user.role, 'patient')


if __name__ == '__main__':
    unittest.main()
