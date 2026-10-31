from openai import OpenAI
from app.config import (
    FEATHERLESS_API_KEY,
    FEATHERLESS_BASE_URL,
    FEATHERLESS_MODEL
)

if not FEATHERLESS_API_KEY:
    raise ValueError("API key is missing.")

print("API key loaded successfully.")
print("Selected model:", FEATHERLESS_MODEL)
print("Connecting to Featherless...")

client = OpenAI(
    base_url=FEATHERLESS_BASE_URL,
    api_key=FEATHERLESS_API_KEY,
    timeout=90.0,
    max_retries=0
)

try:
    response = client.chat.completions.create(
        model=FEATHERLESS_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a helpful AI assistant."
            },
            {
                "role": "user",
                "content": "Reply with exactly: CAREERFIT AI FEATHERLESS CONNECTED"
            }
        ],
        max_tokens=80
    )

    answer = response.choices[0].message.content

    print("\nSUCCESS! Featherless API is working.")
    print("Model:", response.model)
    print("AI response:", answer)

except Exception as error:
    print("\nFEATHERLESS REQUEST FAILED")
    print("Error type:", type(error).__name__)
    print("Error details:", str(error))
    raise
