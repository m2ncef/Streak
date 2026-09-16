'use client'
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function Header(){
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const type = searchParams.get('type')

    function isActive(href) {
        if (href === '/') return pathname === '/'
        if (href === '/browse?type=tv') return pathname === '/browse' && type === 'tv'
        if (href === '/browse?type=movie') return pathname === '/browse' && type === 'movie'
        if (href === '/list') return pathname === '/list'
        return false
    }

    return(
        <div className="Header">
            <div className="HeaderTop">
                <Link href={'/settings'}>
                    <i className="fa fa-cog" aria-hidden="true"></i>
                </Link>
                <div>
                    <h1>Streak</h1>
                </div>
                <Link href={'/browse'}>
                    <i className="fa fa-search" aria-hidden="true"></i>
                </Link>
            </div>
            <nav className="HeaderNav">
                <Link href="/" className={isActive('/') ? 'is-active' : ''}>Home</Link>
                <Link href="/browse?type=tv" className={isActive('/browse?type=tv') ? 'is-active' : ''}>Shows</Link>
                <Link href="/browse?type=movie" className={isActive('/browse?type=movie') ? 'is-active' : ''}>Movies</Link>
                <Link href="/list" className={isActive('/list') ? 'is-active' : ''}>My List</Link>
            </nav>
        </div>
    )
}