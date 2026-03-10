from typing import Optional

import redis.asyncio as aioredis

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class RateLimiter:
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
    
    async def get_redis(self) -> aioredis.Redis:
        if self.redis is None:
            self.redis = await aioredis.from_url(settings.REDIS_URL)
        return self.redis
    
    async def is_rate_limited(self, identifier: str, limit: int = 100, window: int = 60) -> bool:
        """Check if identifier exceeded request limit."""
        try:
            redis_client = await self.get_redis()
            key = f"rate_limit:{identifier}"
            current = await redis_client.get(key)
            
            if current is None:
                await redis_client.setex(key, window, 1)
                return False
            
            if int(current) >= limit:
                return True
            
            await redis_client.incr(key)
            return False
        except Exception as e:
            logger.error(f"Rate limiter error: {e}")
            return False
    
    async def check_rate_limit(
        self,
        identifier: str,
        limit: int = 100,
        window: int = 60
    ) -> bool:
        """Check and update rate limit."""
        return await self.is_rate_limited(identifier, limit, window)
    
    async def reset_limit(self, identifier: str):
        """Reset rate limit for identifier."""
        try:
            redis_client = await self.get_redis()
            key = f"rate_limit:{identifier}"
            await redis_client.delete(key)
        except Exception as e:
            logger.error(f"Rate limiter reset error: {e}")


rate_limiter = RateLimiter()


async def check_api_rate_limit(
    ip: str,
    user_id: Optional[int] = None,
    endpoint: str = "api"
) -> bool:
    """Check rate limit for API requests."""
    if user_id:
        identifier = f"user:{user_id}:{endpoint}"
        limit = 1000
    else:
        identifier = f"ip:{ip}:{endpoint}"
        limit = 100
    
    return await rate_limiter.check_rate_limit(identifier, limit)
