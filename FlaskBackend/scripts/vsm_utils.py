URL_FILE = "url.txt" 
TOKEN_FILE = "token.txt"

def get_url():
    with open(URL_FILE, "r") as file:
        return file.read().strip()

def get_token():
    with open(TOKEN_FILE, "r") as file:
        return file.read().strip()

