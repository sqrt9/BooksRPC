export type AppleBookType = {
    title: string
    author: string
    page: string
    chapter: string
    cover?: string
}

export type WindowInfo = {
    page: string
    chapter: string
    title: string
}

export type OLBookSearch = {
    author_names: string[],
    cover_i: number,
}

export type OLCoverSearch = {
    cover_medium: string
}

export type OLBook = {
    author_string: string
    cover: string
}