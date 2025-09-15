class UserJSON:
    def __init__(self, id, username, password, name, role):
        self.id = id
        self.username = username
        self.password = password
        self.name = name
        self.role = role

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "password": self.password,
            "name": self.name,
            "role": self.role
        }
