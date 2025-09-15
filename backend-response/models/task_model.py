from dataclasses import dataclass

@dataclass
class Task:
    id: int
    title: str
    description: str = ""  # descripción opcional
    status: str = "todo"   # "todo" | "in-progress" | "done"
