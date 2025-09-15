# src/models/user.py
from dataclasses import dataclass

@dataclass
class User:
    id: int
    username: str
    password: str
    name: str
    role: str
