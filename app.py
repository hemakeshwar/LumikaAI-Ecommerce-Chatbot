from flask import Flask, render_template, request, jsonify
from chatbot import get_response
import csv
import os
from datetime import datetime

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():

    try:
        data = request.get_json()

        user_message = data.get("message", "")

        bot_response = get_response(user_message)

        return jsonify({
            "response": bot_response
        })

    except Exception as e:

        return jsonify({
            "response": f"Error: {str(e)}"
        })


@app.route("/submit_complaint", methods=["POST"])
def submit_complaint():

    try:
        data = request.get_json()

        file_exists = os.path.exists("complaints.csv")

        with open("complaints.csv", "a", newline="", encoding="utf-8") as f:

            writer = csv.writer(f)

            if not file_exists:
                writer.writerow([
                    "timestamp",
                    "order_id",
                    "name",
                    "email",
                    "category",
                    "description"
                ])

            writer.writerow([
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                data.get("order_id", ""),
                data.get("name", ""),
                data.get("email", ""),
                data.get("category", ""),
                data.get("description", "").replace("\n", " ")
            ])

        return jsonify({
            "status": "ok",
            "message": "Complaint submitted successfully."
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == "__main__":

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )