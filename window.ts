import { WindowInfo } from "./types.ts";
import { run } from "run";
import "global-type"

export async function findOpenDocumentAndPage(): Promise<WindowInfo | void> {
    const document = await run(() => {
        const systemEvents = Application("System Events")
        systemEvents.includeStandardAdditions = true;
        const excludedTitles = [
            "Search",
            "Home",
            "Book Store",
            "Audiobook Store",
            "All",
            "Want to Read",
            "Finished",
            "Books",
            "Audiobooks",
            "PDFs",
            "My Samples",
            "New Collection",
            "Account"
        ]

        // deno-lint-ignore no-explicit-any
        function isPageElement(element: any) {
            if(element.description &&
                  element.description().toLowerCase().includes("page") &&
                  !element.description().toLowerCase().includes("chooser") &&
                  !element.description().toLowerCase().includes("chapter")) {
                return true
            }
            return false
        }
        // deno-lint-ignore no-explicit-any
        function isChapterElement(element: any) {
            if(element.description && element.description().toLowerCase().includes("in chapter")) {
                return true
            }
            return false
        }
        // deno-lint-ignore no-explicit-any
        function findElement(element: any, f: (element: any) => boolean, visited: Set<any> = new Set()): string | undefined {
            if (visited.has(element)) return undefined
            visited.add(element)
            if (f(element)) return element.description().toLowerCase()
            const children = element.uiElements()
            if (children) {
                for (let i = 0; i < children.length; i++) {
                    const found = findElement(children[i], f, visited)
                    if (found) return found
                }
                return undefined
            }
        }


        const booksAppUI = systemEvents.processes.byName("Books");
        if (!booksAppUI.exists()) return;
        const openWindows = booksAppUI.windows()
        const titledWindows = []
        
        for (let i = 0; i < openWindows.length; i++) {
            if (openWindows[i].title().length !== 0 || !excludedTitles.includes(openWindows[i])) {
                titledWindows.push(openWindows[i])
            }
        }

        for (let i = 0; i < titledWindows.length; i++) {
            const win = titledWindows[i]
            const page = findElement(win, isPageElement)
            const chapter = findElement(win, isChapterElement)
            if (page !== undefined || chapter !== undefined) {
                return {page: page, chapter: chapter, title: win.title()}
            }
        }
        throw new Error("No available windows")
    })
    return document as WindowInfo
} 