import pandas as pd
import re
import random

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ==========================================================
# LOAD DATASET
# ==========================================================

df = pd.read_csv("ecommerce_faq.csv", sep="|")

questions = df["question"].tolist()
answers = df["answer"].tolist()

# ==========================================================
# LOAD PRODUCTS
# ==========================================================

try:

    products_df = pd.read_csv("products.csv")

except:

    products_df = pd.DataFrame()

# ==========================================================
# STOPWORDS
# ==========================================================

STOPWORDS = {
    "i", "me", "my", "we", "our", "you", "your",
    "it", "its", "is", "am", "are", "was", "were",
    "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "will", "would", "shall",
    "should", "may", "might", "can", "could",
    "a", "an", "the", "and", "or", "but", "if",
    "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "about", "that", "this", "these",
    "those", "what", "how", "when", "where", "why",
    "who", "which", "please", "tell", "give",
    "get", "want", "need", "know", "like",
    "just", "also"
}

# ==========================================================
# COMMON TYPO CORRECTIONS
# ==========================================================

COMMON_CORRECTIONS = {
    "retun": "return",
    "retrn": "return",
    "delivry": "delivery",
    "paymnt": "payment",
    "refnd": "refund",
    "trak": "track",
    "ordr": "order",
    "cncel": "cancel",
    "prodct": "product"
}

# ==========================================================
# TEXT PREPROCESSING
# ==========================================================

def preprocess(text):

    text = str(text).lower().strip()

    text = re.sub(r"[^\w\s]", " ", text)

    text = re.sub(r"\s+", " ", text)

    tokens = text.split()

    tokens = [
        COMMON_CORRECTIONS.get(token, token)
        for token in tokens
    ]

    tokens = [
        token
        for token in tokens
        if token not in STOPWORDS and len(token) > 1
    ]

    return " ".join(tokens)

# ==========================================================
# PROCESS FAQ QUESTIONS
# ==========================================================

processed_questions = [
    preprocess(question)
    for question in questions
]

# ==========================================================
# TF-IDF MODEL
# ==========================================================

vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),
    min_df=1,
    max_df=0.95,
    sublinear_tf=True
)

question_vectors = vectorizer.fit_transform(
    processed_questions
)

# ==========================================================
# GREETINGS
# ==========================================================

GREETINGS = [
    "hi",
    "hello",
    "hey",
    "hii",
    "helo",
    "greetings",
    "good morning",
    "good afternoon",
    "good evening",
    "howdy",
    "sup",
    "wassup"
]

GREETING_RESPONSES = [

    "Hello! 👋 Welcome to Lumika AI. How can I help you today?",

    "Hi there! 😊 I'm Lumika AI. Ask me anything about orders, returns, products, payments, or delivery.",

    "Hey! 🛍️ Welcome to Lumika AI. How may I assist you today?"
]

def is_greeting(text):

    text = text.lower()

    return any(
        greeting in text
        for greeting in GREETINGS
    )

# ==========================================================
# THANKS / BYE
# ==========================================================

THANKS_WORDS = [
    "thank",
    "thanks",
    "thank you",
    "thx",
    "ty",
    "awesome",
    "great",
    "perfect"
]

BYE_WORDS = [
    "bye",
    "goodbye",
    "exit",
    "quit",
    "see you",
    "later",
    "cya"
]

def is_thanks(text):

    return any(
        word in text.lower()
        for word in THANKS_WORDS
    )

def is_bye(text):

    return any(
        word in text.lower()
        for word in BYE_WORDS
    )

# ==========================================================
# E-COMMERCE KEYWORDS
# ==========================================================

ECOMMERCE_KEYWORDS = [

    "order",
    "orders",
    "delivery",
    "shipping",
    "return",
    "refund",
    "payment",
    "pay",
    "track",
    "tracking",
    "cancel",
    "cancellation",
    "product",
    "products",
    "price",
    "stock",
    "buy",
    "purchase",
    "cart",
    "wishlist",
    "coupon",
    "discount",
    "offer",
    "deal",
    "seller",
    "review",
    "rating",
    "wallet",
    "invoice",
    "exchange",
    "replace",
    "damage",
    "cod",
    "cash",
    "emi",
    "warranty",
    "login",
    "password",
    "address",
    "pincode",
    "charge",
    "fee"
]

OUT_OF_SCOPE_KEYWORDS = [

    "cricket",
    "football",
    "actor",
    "actress",
    "movie",
    "music",
    "song",
    "weather",
    "news",
    "politician",
    "president",
    "prime minister",
    "capital of",
    "history of",
    "recipe",
    "translate",
    "definition",
    "meaning of"
]

def is_out_of_scope(text):

    text = text.lower()

    for keyword in OUT_OF_SCOPE_KEYWORDS:

        if keyword in text:
            return True

    has_ecommerce = any(
        keyword in text
        for keyword in ECOMMERCE_KEYWORDS
    )

    if has_ecommerce:
        return False

    if len(text.split()) <= 2:
        return True

    return False

# ==========================================================
# PRODUCT SEARCH
# ==========================================================

def search_products(query):

    if products_df.empty:

        return None

    query = query.lower()

    results = products_df[
        products_df["name"].astype(str).str.lower().str.contains(query, na=False)
        |
        products_df["brand"].astype(str).str.lower().str.contains(query, na=False)
        |
        products_df["category"].astype(str).str.lower().str.contains(query, na=False)
    ]

    if results.empty:

        return None

    response = "🛒 Product Results:\n\n"

    for _, row in results.head(5).iterrows():

        response += (
            f"📦 {row['name']}\n"
            f"🏷 Brand: {row['brand']}\n"
            f"💰 Price: ₹{row['price']}\n"
            f"⭐ Rating: {row['rating']}\n"
            f"📦 Stock: {row['stock']}\n\n"
        )

    return response

# ==========================================================
# CONFIDENCE
# ==========================================================

CONFIDENCE_THRESHOLD = 0.25

# ==========================================================
# MAIN CHATBOT FUNCTION
# ==========================================================

def get_response(user_input):

    user_input = user_input.strip()

    if not user_input:

        return "Please type a question. 😊"

    # Greeting

    if is_greeting(user_input):

        return random.choice(
            GREETING_RESPONSES
        )

    # Name

    if (
        "your name" in user_input.lower()
        or "ur name" in user_input.lower()
        or "who are you" in user_input.lower()
    ):

        return (
            "I'm Lumika AI 🤖, your E-Commerce Customer Support Assistant."
        )

    # Thanks

    if is_thanks(user_input):

        return (
            "You're welcome! 😊 Let me know if you need anything else."
        )

    # Bye

    if is_bye(user_input):

        return "GOODBYE"
    
    # ==========================================================
    # PRODUCT FEATURES
    # ==========================================================

    lower_input = user_input.lower()

    # Show products

    if (
        "show products" in lower_input
        or "available products" in lower_input
        or lower_input == "products"
    ):

        if products_df.empty:

            return "Product database unavailable."

        response = "🛒 Available Products:\n\n"

        for _, row in products_df.head(10).iterrows():

            response += (
                f"📦 {row['name']} - ₹{row['price']}\n"
            )

        response += "\nShowing first 10 products."

        return response

    # Search products

    product_result = search_products(lower_input)

    if product_result:

        return product_result

    # NLP Matching

    processed_input = preprocess(
        user_input
    )

    user_vector = vectorizer.transform(
        [processed_input]
    )

    similarity_scores = cosine_similarity(
        user_vector,
        question_vectors
    ).flatten()

    best_score = similarity_scores.max()

    best_index = similarity_scores.argmax()

    if best_score < CONFIDENCE_THRESHOLD:

        return (
            "Hmm 🤔 I couldn't understand that clearly.\n"
            "Try asking about orders, payments, delivery, returns, refunds, or products."
        )

    return answers[best_index]

    # Out of scope

    if is_out_of_scope(user_input):

        return (
            "I'm Lumika AI 🤖 and I specialize in E-Commerce support.\n"
            "Please ask questions about:\n"
            "• Orders\n"
            "• Returns\n"
            "• Refunds\n"
            "• Delivery\n"
            "• Payments\n"
            "• Products"
        )

# ==========================================================
# TERMINAL TESTING
# ==========================================================

if __name__ == "__main__":

    print("=" * 60)
    print("🤖 LUMIKA AI — E-Commerce Support Chatbot")
    print("Type 'bye', 'exit', or 'quit' to leave")
    print("=" * 60)

    while True:

        try:

            user_question = input("\nYou: ").strip()

            if not user_question:
                continue

            response = get_response(
                user_question
            )

            if response == "GOODBYE":

                print(
                    "Lumika AI: Goodbye! Have a great day! 👋"
                )

                break

            print(
                f"Lumika AI: {response}"
            )

        except KeyboardInterrupt:

            print(
                "\nLumika AI: Goodbye! 👋"
            )

            break

        except Exception as e:

            print(
                f"\nLumika AI Error: {e}"
            )