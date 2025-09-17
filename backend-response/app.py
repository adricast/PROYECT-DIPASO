# app.py
from flask import Flask
from flask_cors import CORS
from controllers.auth_controller import auth_bp
from controllers.group_controller import group_bp
from controllers.user_controller import user_bp
from controllers.ping_controller import ping_bp
app = Flask(__name__)
# ------------------------------
# Configuración de CORS
# ------------------------------
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.register_blueprint(ping_bp, url_prefix='/api')  # <-- ahora /api/ping funciona

app.register_blueprint(auth_bp)
app.register_blueprint(group_bp, url_prefix='/api/iam-user-groups') # <--- CAMBIA ESTO
app.register_blueprint(user_bp, url_prefix='/api/users') # <--- CAMBIA ESTO

if __name__ == "__main__":
    app.run(debug=True, port=5000)