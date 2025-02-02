# BooksRPC
Discord rich-presence for Apple Books in TypeScript with Deno+Kv-caching

With help from:
- Google Books API
- OpenLib API
- DuckDuckGo HTML API
- Discord RPC library (from denoland)
- JXA run and types
- Inspired by NextFire/Apple Music RPC

Contains:
-TS file for rich presence
-Quiet user Launch Agent (may have to touch books-rpc.log) plist file
<img width="349" alt="image" src="https://github.com/user-attachments/assets/ce6730a9-3fc2-47e2-8771-1fbd0d1ca696" />

You will need homebrew and deno. Deno is a nice JS/TS interpreter with URL imports.
- Launch agents go into ~/Library/LaunchAgents. Check you can run the script (it has the right permissions) with:
  
deno run --allow-env --allow-run --allow-net --allow-read --allow-write --allow-ffi --allow-import --unstable-kv

- Launch agent expects all the code to be in Applications/BooksRPC.

Not working?
- remove xattr's from the plist file
- chmod +x main.ts
- make sure you are the owner of the plist file.
- plutil main.ts

A good free app for generating/configuring plist files is LaunchControl. launchctl is annoying, and these files are unusually picky...
