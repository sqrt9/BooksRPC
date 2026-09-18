# Installing

Install homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Add the tap and install
```bash
brew tap sqrt9/homebrew-booksrpc
brew trust --formula sqrt9/booksrpc/booksrpc
brew install booksrpc
```

Code for the installer script can be found [here](https://github.com/sqrt9/homebrew-booksrpc). You may also use the binary from the releases page, on any macOS 10.10 or later

# Usage
```bash
brew services start booksrpc
```
and
```bash
brew services stop booksrpc
```

# Permissions, features, limitations
The service uses JXA to monitor the System Events process and update your Discord status based on the book you're reading. This accessibility API only has access to:
1. The title of the books application window
2. The page you're on, and, when near the end of a section,
3. How many pages are left in the chapter

Unfortunately this API can only really see visible UI elements. So, finding the name of the author and the cover of the book is done using OpenLibrary's free search API. Responses are cached. You may need to allow it to connect (if you use LuLu, for example). This also means the book has to be *on your screen*. This may be a limitation, or an anti-LARP mechanism.

# Preview
<img width="328" height="424" alt="image" src="https://github.com/user-attachments/assets/1bfa0a02-b576-4b6e-ba93-2f8079cf6a56" />

