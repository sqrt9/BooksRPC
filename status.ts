import { Client, SetActivity } from "discord-rpc";
import { AppleBookType, OLBook } from "./types.ts";
import { findOpenDocumentAndPage } from "./window.ts";
import { app_id, default_app_icon, kv, timeout_search, VERSION } from "./utils.ts";
import { sleep, withTimeout } from "./utils.ts";
import { timeout_reconnect_rpc, timeout_find_window } from "./utils.ts";
import { booksIdling } from "./utils.ts";
import { openLibraryBookSearch, openLibraryCoverSearch } from "./search.ts";
import { truncateTitle, joinAuthorString } from "./utils.ts";
import { cache, checkCache } from "./utils.ts";


export function makeReadingStatus(book: AppleBookType | undefined = undefined): SetActivity {
    let BookReadingStatus: SetActivity = booksIdling
    let progress = undefined
    if (book && book.title && book.author) {
        if (book.page){
            progress = book.page
            if (book.chapter) {
                progress = progress + `, ${book.chapter}`
            }
        } else {
            if (book.chapter) {
                progress = book.chapter
            }
        }
        BookReadingStatus = {
            type: 0,
            statusDisplayType: 0,
            applicationId: app_id,
            name: book.title,
            details: book.author,
            state: progress ? progress : undefined,
            largeImageUrl: book.cover ? book.cover : undefined,
            largeImageKey: book.cover ? book.cover : undefined,
            largeImageText: book.title ? book.title : undefined,
            smallImageKey: default_app_icon,
            smallImageText: "Books"
        }
    }
    return BookReadingStatus
}


export function loginAndRegisterCallback() {
    client.once("ready", async () => {
        while(true) {
            try {
                await main();
                await sleep(timeout_find_window)
            } catch(err) {
                console.log(err)
                client.destroy()
                await sleep(timeout_find_window)
            }
        }
    });

    client.on("disconnect", async () => {
        client.login();
        await sleep(timeout_reconnect_rpc)
    });

    client.login();
}

export async function main() {
    try {
        console.log("Beginning to scan accessibility")
        const bookWindow = await findOpenDocumentAndPage();

        if (!bookWindow) {
            throw new Error(`Found no open windows after ${timeout_find_window}ms`)
        }
        if (!bookWindow.title || (!bookWindow.page && !bookWindow.chapter)) {
            throw new Error("Not enough info from accessibility to build a status")
        } else { console.log("Found window info", bookWindow.title, bookWindow.page, bookWindow.chapter) }

        const bookTitle = truncateTitle(bookWindow.title)
        const bookPage = bookWindow.page
        const bookChapter = bookWindow.chapter
        const cachedBook = await checkCache(bookTitle)
        let bookCover: string
        let bookAuthors: string

        if (cachedBook !== null) {
            console.log("Cached book", cachedBook)
            bookAuthors = cachedBook.author_string
            bookCover = cachedBook.cover

        } else {
            console.log("Searching OpenLibrary for", bookTitle)
            const olSearchResult = await withTimeout(() => openLibraryBookSearch(bookTitle), timeout_search)

            if (!olSearchResult) {
                throw new Error("No results for title, or search was unsuccessful")
            }

            bookAuthors = joinAuthorString(olSearchResult.author_names)
            bookCover = openLibraryCoverSearch(olSearchResult.cover_i).cover_medium
            const olBook: OLBook = {
                author_string: bookAuthors,
                cover: bookCover
            }
            console.log("Caching", olBook)
            cache(bookTitle, olBook)
        }

        const appleBook: AppleBookType = {
                author: bookAuthors,
                title: bookTitle,
                page: bookPage,
                chapter: bookChapter,
                cover: bookCover
            }
            
        const activity = makeReadingStatus(appleBook)
        client.user?.setActivity(activity)

    } catch(err) {
        throw err
    }
}

const client = new Client({
    clientId: app_id
});

process.on("exit", () => {
    kv.close();
    client.destroy();
});

if (Deno.args.includes("--verson") || Deno.args.includes("-v")) {
    console.log(VERSION)
}

loginAndRegisterCallback();
