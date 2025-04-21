#!/usr/bin/env deno run --allow-env --allow-run --allow-net --allow-read --allow-write --allow-ffi --allow-import --unstable-kv main.ts

import "npm:@jxa/global-type";
import { run } from "npm:@jxa/run";
import { Client } from "https://deno.land/x/discord_rpc@0.3.2/mod.ts";
import { Activity } from "https://deno.land/x/discord_rpc@0.3.2/mod.ts";
import { CONTEXT_E_OLDREF } from "https://win32.deno.dev/0.4.1/Foundation";
// import { SetFilePointerEx } from "https://win32.deno.dev/0.4.1/Storage.FileSystem";
// import { TIMER_OR_DPC_INVALID } from "https://win32.deno.dev/0.4.1/System.Diagnostics.Debug";


class BooksRPC {
  static readonly KV_VERSION = 0;
  static readonly CLIENT_IDS: Record<"Books", string> = {
    Books: "1335169826661990400"
  }
  static readonly appicon = "https://help.apple.com/assets/67368A9179C56FB1B106D02B/67368A97231AFF3D8A0ADB76/en_US/3805d456c1f34d7f9d4f023a12a0bb67.png"
  
  
  
  private constructor(
    public readonly rpc: Client,
    public readonly kv: Deno.Kv,
    public readonly defaultTimeout: number
  ) {}
  
  async setActivity(): Promise<number> {
    console.log("Checking books state...")
    const bookActivity: BookState = await bookState();
    if (!bookActivity.state || !bookActivity.titled) {
      console.log("Books is not open, or it's idling.")
      await this.rpc.clearActivity();
      console.log("RPC status cleared.")
      return this.defaultTimeout;
    }
    
    if (bookActivity.state && bookActivity.titled) {
      // set reading activity
      console.log("Scanning accessibility API...")
      const bookInfo = await getOpenDocumentAndPage();
      if(!bookInfo){
        console.log("State changed. No bookInfo found.");
        return this.defaultTimeout;
      }
      const bookTitle = bookInfo.title;
      console.log("Found title: " + bookTitle)
      const pageNumber = bookInfo.pageDescription.toLowerCase();
      console.log("Page number: " + pageNumber)
      const pagesRemaining = bookInfo.chapterInfoDescription;
      console.log("Page descriptor: " + pagesRemaining)
      const bookData = await this.checkCacheInfo(bookInfo);
      if(bookData === undefined){
        console.log("Can't get bookData.")
        return this.defaultTimeout;
      }
      if (bookData && bookData.authors) {
        const authors = bookData.authors[0];
        console.log("Found titular author: " + authors)
        const pageString = authors + ", " +pageNumber
        //activity strings
        const startTimestamp = Date.now()
        const titleString = bookTitle 
        const buttonLink = bookData.goodReadsLink
        
        const activity: Activity = {
        //@ts-ignore: "It's a real thing"
          type:0,
          details: titleString,
          state: pageString,
          start:startTimestamp
          
        };
        
        if (!bookData.smallThumbnail){
          console.log("No thumbnail found, using appicon.")
          activity.assets = {
            large_image: BooksRPC.appicon,
            large_text: bookTitle
          }
        }
        else{
          console.log("Setting large image to " + bookData?.smallThumbnail)
          activity.assets = {
            large_image: bookData?.smallThumbnail,
            large_text: bookTitle,
            small_image: BooksRPC.appicon,
            small_text: "Apple Books"
          }
            if(buttonLink){
              console.log("Setting button info to " + buttonLink)
              const buttons = [];
              buttons.push({
                label: "View on goodreads",
                url: buttonLink
              });
              activity.buttons = buttons;
            }
          }
          console.log("Setting...")
          await this.rpc.setActivity(activity);
          console.log("Activity set!")
          return this.defaultTimeout
          }
        }
      console.log("No activity set. Timing out.")
      return this.defaultTimeout
    }
async setActivityLoop(): Promise<void> {
  try{
    console.log("Connecting to discord RPC...")
    await this.rpc.connect();
    while(true) {
      const timeout = await this.setActivity();
      await sleep(timeout)
    }
    } finally {
      console.log("Closing RPC.")
      this.tryCloseRPC();
  }
}

tryCloseRPC(): void {
  if (this.rpc.ipc) {
    try {
      this.rpc.close();
    } finally {
      this.rpc.ipc = undefined;
    }
  }
}

  async checkCacheInfo(bookInfo: BookInfo): Promise<BookData | null> {
    console.log("Checking Kv cache for BookInfo object.")
    const title = bookInfo.title
    const cachedData = await this.kv.get<BookData>([title]);
    if (cachedData?.value) {
      console.log("Found cached book!")
      return cachedData.value;
    } else {
      console.log("No cached BookInfo for this book. Creating BookData object...")
      const bookData = await fetchBookDataExact(title);
      if (bookData) {
        console.log("Fetching button data...")
        const bookDataWithButton = await fetchBookDataButton(bookInfo, bookData)
        console.log("Caching BookData.")
        await this.kv.set([title], bookDataWithButton)
        console.log("Cached.")
        return bookData;
      }
      console.log("Can't get anything about this book. Are you connected to the internet?")
      return null
    }
  }

  static async init(defaultTimeout = 15e3): Promise<BooksRPC> {
    console.log("Starting BooksRPC:")
    const kv = await Deno.openKv(`cache_v${this.KV_VERSION}.sqlite3`);
    console.log(" - Cache opened")
    const rpc = new Client({ id: this.CLIENT_IDS.Books });
    console.log(" - Client created")
    console.log (" - Default timeout " + defaultTimeout)
    return new this(rpc, kv, defaultTimeout);
  }

  async clearKvCache(): Promise<void> {
    console.log("Clearing KV cache...");
    for await (const entry of this.kv.list({ prefix: [] })) {
      console.log(`Deleting key: ${entry.key}`);
      await this.kv.delete(entry.key);
    }
    console.log("KV cache cleared!");
  }

  async run(): Promise<void> {
    while (true) {
      try {
        console.log("Trying to set activity")
        await this.setActivityLoop();
      } catch (err) {
        console.error(err);
      }
      console.log("Reconnecting in %dms", this.defaultTimeout);
      await sleep(this.defaultTimeout);
    }
  }
}

interface BookState {
  state: boolean;
  titled: boolean;
}

interface BookInfo {
  title: string;
  pageDescription: string;
  chapterInfoDescription: string;
}

interface BookData {
  authors?: Array<string>;
  publishedDate?: string;
  smallThumbnail?: string;
  goodReadsLink?: string | null
}


function truncateTitle(title: string): string {
  if (title.length > 128) {
    return title.slice(0, 124) + "...";
  }
  return title;
}

function truncateAuthors(authors: string[] | undefined): string {
  // If authors is null or undefined, return an empty string
  if (!authors) return "";

  // If there's only one author, return it as is
  if (authors.length === 1) {
    return authors[0];
  }

  // Add "et al." to the first author if there are multiple authors
  return `${authors[0]} et al.`;
}


export async function bookState(): Promise<BookState> {
  const running = await run (() =>  {
    const excludedTitles = [
      "Home",
      "Book Store",
      "Audiobook Store",
      "All",
      "Want to Read",
      "Finished",
      "Books",
      "Audiobooks",
      "PDFs",
      "My Samples"
    ];
    console.log("Hooking System Events proccess.")
    const SystemEvents = Application("System Events");
    console.log("Looking for open windows.")
    const isRunning = SystemEvents.processes["Books"].exists();
    if (!isRunning || isRunning === undefined) {
      return { state: false, titled: false };
    }

    const BooksAppUI = SystemEvents.processes.byName("Books");
    const windows = BooksAppUI.windows();
    const mainWindow = windows.find((window: any)=> !excludedTitles.includes(window.title()));
    if (!mainWindow) {
      console.log("No valid main window found.");
      return { state: true, titled: false }; 
    }
    const title = mainWindow.title();

    

    if (!title || windows.length === 0) {
      console.log("Found no titled windows.")
      return { state: true, titled: false };
    }
    console.log("Found matching titled window: " + title)
    return { state: true, titled: true };
  });
  return running as BookState
}

export async function getOpenDocumentAndPage(): Promise<BookInfo> {
  let attempts = 0;
  const maxAttempts = 8;
  
  while (attempts < maxAttempts) {
    try {
      const result = await run(() => {
        const excludedTitles = [
          "Home",
          "Book Store",
          "Audiobook Store",
          "All",
          "Want to Read",
          "Finished",
          "Books",
          "Audiobooks",
            "PDFs",
          "My Samples"
        ];
        const SystemEvents = Application("System Events");
        SystemEvents.includeStandardAdditions = true;
        const booksAppUI = SystemEvents.processes.byName("Books");
        const windows = booksAppUI.windows();

        if (!windows.length) {
          throw new Error("No windows found");
        }

        const mainWindow = windows.find((window: any) => !excludedTitles.includes(window.title()));
        if (!mainWindow) {
          throw new Error("No valid main window found");
        }

        const title = mainWindow.title();
        if (!title) {
          throw new Error("Main window has no title");
        }

        function findPageElement(element: any): any {
          if (
            element.description &&
            element.description().toLowerCase().includes("page") &&
            !element.description().toLowerCase().includes("page chooser")
          ) {
            return element;
          }
          const children = element.uiElements();
          for (let i = 0; i < children.length; i++) {
            const found = findPageElement(children[i]);
            if (found) {
              return found;
            }
          }
          return null;
        }

        const pageElement = findPageElement(mainWindow);
        let pageDescription = "No Page Element Found";
        if (pageElement) {
          pageDescription = pageElement.description();
        }

        function findChapterInfoElement(element: any): any {
          if (element.description && (
            element.description().toLowerCase().includes("pages left in chapter") ||
            element.description().toLowerCase().includes("last page in chapter")
          )) {
            return element;
          }
          const children = element.uiElements();
          for (let i = 0; i < children.length; i++) {
            const found = findChapterInfoElement(children[i]);
            if (found) {
              return found;
            }
          }
          return null;
        }

        const chapterInfoElement = findChapterInfoElement(mainWindow);
        let chapterInfoDescription = "No Chapter Info Found";
        if (chapterInfoElement) {
          chapterInfoDescription = chapterInfoElement.description();
        }

        return { title, pageDescription, chapterInfoDescription };
      });
      return result as BookInfo;

    } catch (err: any) {
      console.error(`Attempt ${attempts + 1} failed:`, err.message);
      if (
        err.message.includes("Invalid index") ||
        err.message.includes("No valid main window found") ||
        err.message.includes("Can't get object") // Handle Can't get object error
      ) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 200)); // Short delay before retrying
      } else {
        throw err; // If it's a different error, stop retrying
      }
    }
  }

  throw new Error("Failed to retrieve document and page after multiple attempts.");
}

function getSimilarity(str1: string, str2: string): number {
  // A simple similarity measure: count matching words.
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  let matches = 0;
  for (const word of words1) {
    if (words2.includes(word)) {
      matches++;
    }
  }
  return matches;
}

export async function fetchBookDataExact(title: string): Promise<BookData | null> {
  console.log("fetchBookDataExact called with title:", title)
  // First attempt: Google Books API search by title only
  const query = encodeURIComponent(`intitle:"${title}"`);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40`;

  try {
    console.log("Searching Google Books with request " + url)
    const response = await fetch(url);
    const data = await response.json();
    console.log("Google Books API response received");

    if (!data.items || data.items.length === 0) {
      console.log("No response or zero result from Google.")
      throw new Error();
    }

    const exactMatches = data.items.filter((item: any) => {
      const volTitle = item.volumeInfo.title || "";
      return volTitle.trim().toLowerCase() === title.trim().toLowerCase();
    });
    if (exactMatches.length === 0) {
      console.log("No exact match found.");
      throw new Error();
    }

    console.log("Exact match found in Google Books");
    const book = exactMatches[0].volumeInfo;
    console.log(book.authors)
    return {
      authors: book.authors,
      publishedDate: book.publishedDate,
      smallThumbnail: book.imageLinks ? book.imageLinks.smallThumbnail : null,
    };
  } catch (err) {
    console.log("Google Books search failed or no exact match:", err);
    // Fallback: Use OpenLibrary
    // Strip punctuation from title (e.g. commas, apostrophes, etc.)
    const strippedTitle = title.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
    const openLibUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(strippedTitle)}`;
    console.log("Querying OpenLibrary with:", openLibUrl);
    const openLibResponse = await fetch(openLibUrl);
    const openLibData = await openLibResponse.json();

    if (!openLibData.docs || openLibData.docs.length === 0) {
      console.log("No results from OpenLibrary");
      return {
        authors: undefined,
        publishedDate: undefined,
        smallThumbnail: undefined,
      };
    }

    // Choose the most similar result based on the title.
    let bestMatch = openLibData.docs[0];
    let maxSim = 0;
    for (const doc of openLibData.docs) {
      const docTitle = doc.title || "";
      const sim = getSimilarity(strippedTitle.toLowerCase(), docTitle.toLowerCase());
      if (sim > maxSim) {
        bestMatch = doc;
        maxSim = sim;
      }
    }
    console.log("Best OpenLibrary match:", bestMatch.title);

    // Extract author(s) from OpenLibrary.
    const openLibAuthors: string[] = bestMatch.author_name || [];
    // Use the first author (if available), stripping punctuation.
    const strippedAuthor = openLibAuthors[0]
      ? openLibAuthors[0].replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ")
      : "";

    // Second attempt: Google Books API search with title and author.
    const query2 = encodeURIComponent(`intitle:"${strippedTitle}" inauthor:"${strippedAuthor}"`);
    const url2 = `https://www.googleapis.com/books/v1/volumes?q=${query2}&maxResults=40`;
    console.log("Querying Google Books again with:", url2);
    try {
      const response2 = await fetch(url2);
      const data2 = await response2.json();
      if (data2.items && data2.items.length > 0) {
        // Choose the best match by title similarity.
        let bestMatch2 = data2.items[0];
        let maxSim2 = 0;
        for (const item of data2.items) {
          const volTitle = item.volumeInfo.title || "";
          const sim2 = getSimilarity(strippedTitle.toLowerCase(), volTitle.toLowerCase());
          if (sim2 > maxSim2) {
            bestMatch2 = item;
            maxSim2 = sim2;
          }
        }
        const book2 = bestMatch2.volumeInfo;
        console.log("Second Google Books search found a match:", book2.title);
        return {
          authors: book2.authors || openLibAuthors,
          publishedDate: book2.publishedDate || null,
          smallThumbnail: book2.imageLinks ? book2.imageLinks.smallThumbnail : null,
        };
      } else {
        console.log("No results from second Google Books search");
        return {
          authors: openLibAuthors,
          publishedDate: undefined,
          smallThumbnail: undefined,
        };
      }
    } catch (err2) {
      if (err2 instanceof Error) {
        console.log("Second Google Books search failed:", err2.message);
      } else {
        console.log("Second Google Books search failed with unknown error");
      }
      return {
        authors: openLibAuthors,
        publishedDate: undefined,
        smallThumbnail: undefined,
      };
    }
  }
}


export async function fetchBookDataButton(bookInfo: BookInfo, bookData: BookData): Promise<BookData> {
  console.log("fetchBookDataButton called with bookInfo and bookData objects.");

  // If there is no author information, we cannot perform the search.
  if (!bookData.authors || bookData.authors.length === 0) {
    console.log("No author info; setting goodReadsLink to null.");
    bookData.goodReadsLink = null;
    return bookData;
  }

  // Retrieve the title from bookInfo and the first author from bookData.
  const title = bookInfo.title;
  const author = bookData.authors[0]; // Use the first author
  const query = encodeURIComponent(`${title} ${author} site:goodreads.com`);
  const url = `https://html.duckduckgo.com/html/?q=${query}`;

  console.log("DuckDuckGo HTML query URL:", url);

  try {
    const response = await fetch(url);
    const text = await response.text();  // Get the response as HTML
    // console.log("DuckDuckGo HTML response:", text);

    // Look for the link within the redirect URL
    const regex = /href="\/\/duckduckgo\.com\/l\/\?uddg=([^"]+)"/g;
    let match;
    let goodreadsUrl: string | null = null;

    // Find the first redirect link
    while ((match = regex.exec(text)) !== null) {
      const encodedLink = match[1]; // Extract the encoded link (after "uddg=")
      const decodedLink = decodeURIComponent(encodedLink); // Decode the URL-encoded link

      // We should now have the correct Goodreads link
      if (decodedLink.includes("www.goodreads.com")) {
        goodreadsUrl = decodedLink;
        break;
      }
    }

    console.log("Found Goodreads URL:", goodreadsUrl);
    bookData.goodReadsLink = goodreadsUrl;
    return bookData;

  } catch (error) {
    console.error("Error fetching Goodreads link via DuckDuckGo HTML API:", error);
    bookData.goodReadsLink = null;
    return bookData;
  }
}


function sleep(ms: number): Promise<void> {
  console.log("Zzzz...")
  return new Promise((resolve) => setTimeout(resolve, ms));
}


const client = await BooksRPC.init();
await client.clearKvCache();
client.tryCloseRPC();
await client.run();


// debug

// export const getWindowTitles = async () => {
//   const result = await run(() => {
//     const SystemEvents = Application("System Events");
//     SystemEvents.includeStandardAdditions = true; // Enable standard additions
//     const booksAppUI = SystemEvents.processes.byName("Books");
//     const windows = booksAppUI.windows(); // Get all windows of Books
//     return windows.map(window => window.title()); // Return an array of titles
//   });
//   return result;
// };

// export const windowTitles = async () => {
//   const titles = await getWindowTitles();
//   if (titles.length > 0) {
//     titles.forEach(title => {
//       console.log(title); // Log the title of each window
//     });
//   } else {
//     console.log("No windows found or invalid window objects.");
//   }
// };

// windowTitles();
