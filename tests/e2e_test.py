from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time
import sys

def run_test():
    print("Starting headless Chrome browser...")
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(options=chrome_options)
    target_url = "http://localhost:8080/login.php"

    try:
        print(f"Navigating to {target_url}...")
        driver.get(target_url)
        
        # Wait for the containers and PHP to be fully ready
        time.sleep(5)

        print(f"Page title retrieved: {driver.title}")

        if "OpenSparrow" in driver.title:
            print("Test Passed: Page loaded successfully and title matches.")
            sys.exit(0)
        else:
            print("Test Failed: Page title does not contain 'OpenSparrow'.")
            sys.exit(1)

    except Exception as e:
        print(f"Test Failed: An error occurred: {str(e)}")
        sys.exit(1)
    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()