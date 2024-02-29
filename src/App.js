import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './Pages/Home'
import Error from './Pages/404'
import Movie from './Pages/Movie'
import Show from './Pages/Show'
import List from './Pages/List'
import Explore from './Pages/Explore'
import { useEffect } from 'react'
import Login from './Pages/Login'
import Settings from './Pages/Settings'

export default function App() {
    useEffect(()=>{
        document.title = 'Streak '
    })
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Home/>}></Route>
                <Route path='/login' element={<Login/>}></Route>
                <Route path='/list' element={<List/>}></Route>
                <Route path='/settings' element={<Settings/>}></Route>
                <Route path='/movie/:id' element={<Movie/>}></Route>
                <Route path='/tv/:id' element={<Show/>}></Route>
                <Route path='/movie/' element={<Explore type='movie'/>}></Route>
                <Route path='/tv/' element={<Explore type='tv'/>}></Route>
                <Route path='*' element={<Error/>}></Route>
            </Routes>
        </BrowserRouter>
    )
}