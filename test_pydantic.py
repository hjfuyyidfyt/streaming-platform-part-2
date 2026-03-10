from pydantic import BaseModel, EmailStr

try:
    class UserRegister(BaseModel):
        username: str
        email: EmailStr
        password: str
        
    print("Model defined successfully.")
    
    # Now try to instantiate it
    u = UserRegister(username="test", email="test@example.com", password="pwd")
    print("Instantiated successfully.")
except Exception as e:
    print(f"Error: {e}")
