# 🤖 Lumika AI - E-Commerce Customer Support Chatbot

Lumika AI is an AI-powered E-Commerce Customer Support Chatbot developed using Python, Flask, TF-IDF, and Cosine Similarity. The chatbot assists customers with common e-commerce queries such as orders, returns, refunds, payments, delivery, and product information.

---

## 📌 Project Overview

Lumika AI was developed as an MCA mini project to provide intelligent customer support for e-commerce platforms.

The system uses Natural Language Processing (NLP) techniques to understand user queries and retrieve the most relevant response from a large FAQ knowledge base.

---

## ✨ Features

### 💬 Intelligent Chatbot
- Natural language query handling
- Greeting and farewell detection
- Out-of-scope query handling
- NLP-based FAQ matching

### 🛒 Product Catalog
- Browse 75+ products
- Product search functionality
- Product details display
- Category filtering

### 📚 FAQ System
- 1000+ Frequently Asked Questions
- Fast response retrieval
- Similarity-based answer matching

### 📊 Analytics Dashboard
- FAQ statistics
- Product statistics
- User interaction tracking

### ⭐ Feedback System
- Helpful / Not Helpful feedback
- Feedback storage in CSV format

### 📄 Export Features
- Export chat as TXT
- Export chat as PDF

### 🎨 Modern User Interface
- Dark Theme
- Light Theme
- Multiple theme support
- Responsive design
- Glassmorphism inspired layout

---

## 🛠️ Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Python
- Flask

### NLP & Data Processing
- Pandas
- Scikit-Learn
- TF-IDF Vectorizer
- Cosine Similarity

### Dataset
- FAQ Dataset (1000+ Questions)
- Product Dataset (540 Products)

---

## 📂 Project Structure

```
LumikaAI/
│
├── app.py
├── chatbot.py
├── products.csv
├── ecommerce_faq.csv
├── complaints.csv
├── feedback.csv
├── requirements.txt
│
├── templates/
│   └── index.html
│
└── static/
    ├── style.css
    └── script.js
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/hemakeshwar/LumikaAI-Ecommerce-Chatbot.git
cd LumikaAI-Ecommerce-Chatbot
```

### Create Virtual Environment

```bash
python -m venv .venv
```

### Activate Environment

Linux:

```bash
source .venv/bin/activate
```

Windows:

```bash
.venv\Scripts\activate
```

### Install Requirements

```bash
pip install -r requirements.txt
```

### Run Application

```bash
python app.py
```

Open:

```
http://127.0.0.1:5000
```

---

## 🎯 Future Enhancements

- Database Integration (MySQL/PostgreSQL)
- User Authentication
- Persistent Chat History
- Product Recommendation Engine
- Machine Learning Intent Classification
- Cloud Deployment

---

## 👨‍💻 Author

**Hemakeshwar**

MCA Student

Project: Lumika AI - E-Commerce Customer Support Chatbot

---

## 📄 License

This project is licensed under the MIT License.
