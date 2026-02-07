"use server";

import { connectToDatabase } from '@/database/mongoose';
import Watchlist from '@/database/models/watchlist.model';

export const getWatchlistSymbolsByEmail = async (email: string): Promise<string[]> => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return [];

    const user = await db.collection('user').findOne({ email });
    if (!user) return [];

    const userId = (user.id && String(user.id)) || (user._id && String(user._id)) || '';
    if (!userId) return [];

    // Use the Watchlist collection to get symbols
    const items = await Watchlist.find({ userId }).select('symbol -_id').lean();
    if (!items || items.length === 0) return [];

    return items.map((it) => String(it.symbol));
  } catch (e) {
    console.error('Error getting watchlist symbols for email', email, e);
    return [];
  }
};

export default getWatchlistSymbolsByEmail;
