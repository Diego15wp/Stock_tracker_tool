'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

const WatchlistButton = ({ symbol }: WatchlistButtonProps) => {
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleWatchlist = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual watchlist add/remove logic
      setIsAdded(!isAdded);
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggleWatchlist}
      disabled={isLoading}
      variant={isAdded ? 'default' : 'outline'}
      className="w-full"
    >
      {isLoading ? 'Loading...' : isAdded ? '✓ Added to Watchlist' : '+ Add to Watchlist'}
    </Button>
  );
};

export default WatchlistButton;
