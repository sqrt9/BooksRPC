import { OLBook } from "./types.ts";

export const VERSION = 0.1
export const default_app_icon = "https://help.apple.com/assets/67368A9179C56FB1B106D02B/67368A97231AFF3D8A0ADB76/en_US/3805d456c1f34d7f9d4f023a12a0bb67.png"
export const olbooksearch = new URL("https://openlibrary.org/search.json?q=")
export const olcoversearch = new URL("https://covers.openlibrary.org/b/id/")
export const olbooksearchparams = "&fields=cover_i,author_name&limit=10"
export const olcoversearchparams = "-L.jpg"
export const app_id = "1335169826661990400"
export const timeout_find_window = 10000
export const timeout_reconnect_rpc = 5000
export const timeout_search = 10000
export const kv = await Deno.openKv()
export const booksIdling = {
    applicationId: app_id,
    type: 0,
    statusDisplayType: 0,
    details: "--/--",
    state: "Idling"
}

export function sleep(t: number): Promise<void> { 
    return new Promise((res) => {setTimeout(res, t)}); 
}

export function withTimeout<T> (f: () => Promise<T>, t: number): Promise<T | void> {
    return Promise.race([f(), sleep(t)])
}

export function truncateTitle(s: string): string {
    if (s.length > 128) {
        const t = s.substring(0,126) + "..."
        return t
    }
    return s
}

export function joinAuthorString(a: string[]): string {
    if (a.length === 1) {
        return a[0]
    } else {
        let s = ""
        for (let i = 0; i < a.length; i++) {
            if (i === (a.length - 1)) {
                s += a[i]
            } else {
                s = a[i] + ", "
            }
        }
        return s
    }
}

export function cache(s: string, a: OLBook): void {
    kv.set([s], a)
}

export async function checkCache(s: string): Promise<OLBook | null> {
    const res = await kv.get([s])
    if (res.value === null) {
        return null
    }
    const book = res.value as OLBook
    return book
}