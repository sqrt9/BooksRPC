# BooksRPC
Discord rich-presence for Apple Books in TypeScript with Deno Kv-caching

<img width="249" alt="image" src="https://github.com/user-attachments/assets/cd572d84-5d3f-4772-b2de-5360eab02b3d" />



With help from:
- Google Books API
- OpenLib API
- DuckDuckGo HTML API
- Discord RPC library (from denoland)
- JXA run and types
- Inspired by NextFire/Apple Music RPC

Contains:
- TS file for rich presence
- Quiet user Launch Agent .plist file


You will need homebrew and deno. Deno is a nice JS/TS interpreter with URL imports.
- Launch agents go into ~/Library/LaunchAgents. First check you can run the script (it has the right permissions) with:
  
deno run --allow-env --allow-run --allow-net --allow-read --allow-write --allow-ffi --allow-import --unstable-kv main.ts

- Launch agent expects all the code to be in Applications/BooksRPC.

Not working?
- remove xattr's from the plist file
- chmod +x main.ts
- make sure you are the owner of the plist file.
- plutil main.ts

A good free app for generating/configuring plist files is LaunchControl. launchctl is annoying, and these files are unusually picky.

How it works --

Since there's no public API for the books app (like there is for music, etc.) it works by scanning the Accessibility API for the books app and grabs the window title of the book you're reading. One pitfall of System Events is that it needs to be rendered on the screen to be found, and the index of other elements (page number) will change if you're moving the window. To fix this, the script will keep searching for valid elements until it gives up and closes the rpc. It's not a problem unless you're flipping through pages continuously ~30 seconds. Because System Events can only (mostly) see rendered elements, the window title is the only info it can gather, so it will search Google Books for your book, try to find a match, if it doesn't, it will fall back to OpenLibrary. With the best result from OpenLibrary it will re-search a stripped title on Google Books again (the only API it can get a cover url from). Hopefully it's assembled by now some good data; it was able to find all the books I'd tested it with. Then, it will try and get a goodreads url by searching DuckDuckGo, and attatch it to a button on your status. It will cache valid results on your computer. It will look for updates every 15 seconds by default. Yay! 
