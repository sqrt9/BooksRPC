import { olbooksearch, olbooksearchparams } from "./utils.ts"
import { olcoversearch, olcoversearchparams } from "./utils.ts"
import { OLBookSearch, OLCoverSearch } from "./types.ts"

export async function openLibraryBookSearch(t: string): Promise<OLBookSearch | void> {
    const title = encodeURIComponent(t)
    const response = await fetch(olbooksearch + title + olbooksearchparams)
    const json = await response.json()
    const results = json.docs
    for (let i = 0; i < results.length; i++ ) {
        const author_names = results[i].author_name
        const cover_i = results[i].cover_i
        if (author_names && cover_i) {
            return {author_names: author_names, cover_i: cover_i}
        }
    }
    return
}

export  function openLibraryCoverSearch(i: number): OLCoverSearch {
    return {cover_medium: olcoversearch + String(i) + olcoversearchparams }
}