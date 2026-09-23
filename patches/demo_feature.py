"""
🎉 Demo Feature Module
======================
This is a demo module to test hot-reloading functionality.
"""

VERSION = "1.0.0"


def get_feature_info():
    """Get information about this feature."""
    return {
        "name": "Demo Feature",
        "version": VERSION,
        "description": "This is a demo feature to test auto-update system",
        "status": "active"
    }


def greet(name="User"):
    """Greet a user."""
    return f"Hello {name}! This is Demo Feature v{VERSION}"


def calculate(a, b, operation="add"):
    """Perform a calculation."""
    operations = {
        "add": lambda x, y: x + y,
        "subtract": lambda x, y: x - y,
        "multiply": lambda x, y: x * y,
        "divide": lambda x, y: x / y if y != 0 else "Error: Division by zero"
    }
    
    if operation not in operations:
        return f"Error: Unknown operation '{operation}'"
    
    return operations[operation](a, b)


if __name__ == "__main__":
    print(get_feature_info())
    print(greet("Developer"))
    print(f"5 + 3 = {calculate(5, 3, 'add')}")
    print(f"10 - 4 = {calculate(10, 4, 'subtract')}")
