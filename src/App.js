import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './Pages/Home'
import Error from './Pages/404'
import Movie from './Pages/Movie'
import Show from './Pages/Show'
import List from './Pages/List'
import Explore from './Pages/Explore'
import MovieScraper from './Components/MovieScraper'
import { useEffect } from 'react'

export default function App() {
    useEffect(()=>{
        document.title = 'Streak '
    })
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Home/>}></Route>
                <Route path='/scrapeMovie/:id/:year/:title' element={<MovieScraper/>}></Route>
                <Route path='/list' element={<List/>}></Route>
                <Route path='/explore/:q' element={<Explore/>}></Route>
                <Route path='/movie/:id' element={<Movie/>}></Route>
                <Route path='/tv/:id' element={<Show/>}></Route>
                <Route path='*' element={<Error/>}></Route>
            </Routes>
        </BrowserRouter>
    )
}