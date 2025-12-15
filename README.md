# BooksRPC
Discord rich-presence for Apple Books in TypeScript with Deno+Kv-caching

With help from:
- Google Books API
- OpenLib API
- DuckDuckGo HTML API
- Discord RPC library (from denoland)
- JXA run and types
- Inspired by NextFire/Apple Music RPC

Because the apple books API is not open, and everything must be interpreted from titles alone, sometimes it's not so accurate with lesser known titles.
For example, there is no way to tell the difference between "The Idiot" by Elif Batuman and "The Idiot" by Fyodor Dostoevsky. Unfortunately this is unfixable until Apple allows more info through the accessibility API.

As another note, the goodreads button isn't working because of the depreciation of the DuckDuckGo API. I personally don't use the site, and it was more of a fun experiment, so you are welcome to fix this yourself with another method and let me know.
