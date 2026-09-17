import { WindowInfo } from "./types.ts";
import { run } from "run";
import "global-type"

export async function findOpenDocumentAndPage(): Promise<WindowInfo | void> {
    const document = await run(() => {
        const systemEvents = Application("System Events")
        systemEvents.includeStandardAdditions = true;
        const booksIsRunning = systemEvents.processes["Books"].exists()
        const booksAppUI = systemEvents.processes.byName("Books");
        const openWindows = booksAppUI.windows()
        const titledWindows = []
        let page: string | undefined
        let chapter: string | undefined
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
        function findPageAndOrChapter(element: any) {
            const children = element.uiElements()
            for (let i = 0; i < children.length; i++) { //DFS
                const child = children[i]
                if (page !== undefined && chapter !== undefined) {
                    return {page: page, chapter: chapter}
                } else {
                    if (isPageElement(children[i])) {
                        page = child.description().toLowerCase()
                    }
                    if (isChapterElement(children[i])) {
                        chapter = child.description().toLowerCase()
                    }
                }
                findPageAndOrChapter(child)
            }
            return {page: page, chapter: chapter}
        }

        if (booksIsRunning) {
            for (let i = 0; i < openWindows.length; i++) {
                if (openWindows[i].title().length != 0) {
                    titledWindows.push(openWindows[i])
                }
            }

            for (let i = 0; i < titledWindows.length; i++) {
                const bookWindow = findPageAndOrChapter(titledWindows[i])
                if (bookWindow.page !== undefined || bookWindow.chapter !== undefined) {
                    return {page: bookWindow.page, chapter: bookWindow.chapter, title: titledWindows[i].title()}
                }
            }
        }
        return
    })
    return document as WindowInfo
} 