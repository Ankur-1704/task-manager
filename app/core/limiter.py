from slowapi import Limiter
from slowapi.util import get_remote_address

# Per-process rate limits. Behind multiple workers or replicas, use Redis storage (slowapi supports it).
limiter = Limiter(key_func=get_remote_address)
