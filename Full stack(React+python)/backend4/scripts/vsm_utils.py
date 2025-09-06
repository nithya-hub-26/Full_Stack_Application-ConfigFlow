#URL_FILE = "url.txt"  # 1 - 10.90.35.221   # 2 - 10.169.22.17
#TOKEN_FILE = "token.txt"
#VERIFY_FILE = "verify.txt"
import os

# Get the backend/ path (one level above scripts/)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL_FILE = os.path.join(BASE_DIR, "url.txt")
TOKEN_FILE = os.path.join(BASE_DIR, "token.txt")
VERIFY_FILE = os.path.join(BASE_DIR, "verify.txt")
CERT_FILE = os.path.join(BASE_DIR, "vsm_cert.pem")

def get_url():
    with open(URL_FILE, "r") as file:
        return file.read().strip()

def get_token():
    with open(TOKEN_FILE, "r") as file:
        return file.read().strip()

def get_verify():
    return CERT_FILE

