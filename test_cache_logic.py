from backend.services.cache import SimpleCache
import time

def test_cache():
    cache = SimpleCache()
    print("Testing SET...")
    cache.set("test_key", "test_value", ttl=2)
    
    print("Testing GET (immediate)...")
    val = cache.get("test_key")
    print(f"Result: {val} (Expected: test_value)")
    
    print("Testing GET (after 3s)...")
    time.sleep(3)
    val = cache.get("test_key")
    print(f"Result: {val} (Expected: None)")

    print("Testing INVALIDATE...")
    cache.set("v_1", "val1")
    cache.set("v_2", "val2")
    cache.invalidate("v_")
    print(f"Result v_1: {cache.get('v_1')} (Expected: None)")

if __name__ == "__main__":
    test_cache()
