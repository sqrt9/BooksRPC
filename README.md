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

A good free app for generating/configuring plist files is LaunchControl. launchctl is annoying, and these files are unusually picky...
