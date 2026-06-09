import * as React from 'react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Link from '@mui/material/Link';
// import logo from '../../../public/logo.png';

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

const pages = [
    {
        name: 'Clientes',
        url: '/dental/list-client'
    },
    {
        name: 'Productos',
        url: '/dental/product-list'
    },
    {
        name: 'Marcas',
        url: '/dental/marcas'
    },
    // {
    //     name: 'Stock',
    //     url: '/dental/stock'
    // },
];

const pageSeguros = [
    {
        name: 'Alta Clientes',
        url: '/cseguros/create'
    },
    {
        name: 'Listado Clientes',
        url: '/cseguros/list-clients'
    },
]
const pageWindy = [
    {
        name: 'Clientes',
        url: "/logistic/list-client"
    },
    {
        name: 'Productos',
        url: "/logistic/list-products"
    },
    {
        name: 'Cambiar precios',
        url: "/logistic/change-price"
    },
    {
        name: 'Pedidos',
        url: "/logistic/list-pedidos"
    },
    {
        name: 'Compras',
        url: "/logistic/compras-list"
    },
    {
        name: 'Gastos',
        url: "/logistic/gastos-list"
    },
    {
        name: 'Marcas',
        url: '/logistic/list-marcas'
    },
    {
        name: 'Estadísticas',
        url: '/logistic/estadisticas'
    },
]

const pageMax = [
    {
        name: 'Listado Clientes',
        url: "/max/list-client"
    },
    {
        name: 'Listado Productos',
        url: "/max/list-products"
    },
    {
        name: 'Cambiar precios',
        url: "/max/change-price"
    },
    {
        name: 'Listado Pedidos',
        url: "/max/list-pedidos"
    },
    {
        name: 'Compras',
        url: "/max/compras-list"
    },
    {
        name: 'Gastos',
        url: "/max/gastos-list"
    },
    {
        name: 'Marcas',
        url: '/max/list-marcas'
    },
    {
        name: 'Estadísticas',
        url: '/max/estadisticas'
    },
]

const pageNico = [
    {
        name: 'Listado Clientes',
        url: "/nico/list-client"
    },
    {
        name: 'Listado Productos',
        url: "/nico/list-products"
    },
    {
        name: 'Cambiar precios',
        url: "/nico/change-price"
    },
    {
        name: 'Listado Pedidos',
        url: "/nico/list-pedidos"
    },
    {
        name: 'Compras',
        url: "/nico/compras-list"
    },
    {
        name: 'Gastos',
        url: "/nico/gastos-list"
    },
    {
        name: 'Marcas',
        url: '/nico/list-marcas'
    },
    {
        name: 'Estadísticas',
        url: '/nico/estadisticas'
    },
]

// Menú restringido para max-vendedor (solo crear pedidos)
const pageMaxVendedor = [
    {
        name: 'Listado Clientes',
        url: "/max/list-client"
    },
    {
        name: 'Listado Productos',
        url: "/max/list-products"
    },
    {
        name: 'Listado Pedidos',
        url: "/max/list-pedidos"
    },
]

// Menú restringido para nico-vendedor (solo crear pedidos)
const pageNicoVendedor = [
    {
        name: 'Listado Clientes',
        url: "/nico/list-client"
    },
    {
        name: 'Listado Productos',
        url: "/nico/list-products"
    },
    {
        name: 'Listado Pedidos',
        url: "/nico/list-pedidos"
    },
]

const pageAdmin = [
    {
        name: 'Precios',
        url: '/prices'
    },
]
// const settings = ['Profile', 'Account', 'Dashboard', 'Salir'];
const settings = ['Salir'];

function NavBar() {
    const [anchorElNav, setAnchorElNav] = React.useState(null);
    const [anchorElUser, setAnchorElUser] = React.useState(null);


    const handleOpenNavMenu = (event) => {
        setAnchorElNav(event.currentTarget);
    };
    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleClickMenu = () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
    }


    return (
        <AppBar position="static" className='toolbar-app' sx={{ backgroundColor: '#d8d6d6' }}>
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    {/* <div>
                        <a href='/'>TopTec</a>
                    </div> */}

                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleOpenNavMenu}
                            color="inherit"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElNav}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            open={Boolean(anchorElNav)}
                            onClose={handleCloseNavMenu}
                            sx={{
                                display: { xs: 'block', md: 'none' },
                            }}
                        >
                            {currentUser?.rol === "windy" &&
                                pageWindy.map((page) => (
                                    <MenuItem key={page.name}>
                                        <Link href={page.url} sx={{ textDecoration: 'none', color: '#000' }}>{page.name}</Link>
                                    </MenuItem>
                                ))}
                            {currentUser?.rol === "seguros" &&
                                pageSeguros.map((page) => (
                                    <MenuItem key={page.name}>
                                        <Link href={page.url} sx={{ textDecoration: 'none', color: '#000' }}>{page.name}</Link>
                                    </MenuItem>
                                ))}
                            {currentUser?.rol === "max" &&
                                pageMax.map((page) => (
                                    <MenuItem key={page.name}>
                                        <Link href={page.url} sx={{ textDecoration: 'none', color: '#000' }}>{page.name}</Link>
                                    </MenuItem>
                                ))}
                            {currentUser?.rol === "max-vendedor" &&
                                pageMaxVendedor.map((page) => (
                                    <MenuItem key={page.name}>
                                        <Link href={page.url} sx={{ textDecoration: 'none', color: '#000' }}>{page.name}</Link>
                                    </MenuItem>
                                ))}
                            {currentUser?.rol === "nico" &&
                                pageNico.map((page) => (
                                    <MenuItem key={page.name}>
                                        <Link href={page.url} sx={{ textDecoration: 'none', color: '#000' }}>{page.name}</Link>
                                    </MenuItem>
                                ))}
                            {currentUser?.rol === "nico-vendedor" &&
                                pageNicoVendedor.map((page) => (
                                    <MenuItem key={page.name}>
                                        <Link href={page.url} sx={{ textDecoration: 'none', color: '#000' }}>{page.name}</Link>
                                    </MenuItem>
                                ))}
                        </Menu>
                    </Box>
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                        {currentUser?.rol === "windy" &&
                            pageWindy.map((page) => (
                                <Button
                                    key={page.name}
                                    href={page.url}
                                    onClick={handleCloseNavMenu}
                                    sx={{ my: 2, color: 'black', display: 'block', marginLeft: '10px' }}
                                >
                                    {page.name}
                                </Button>
                            ))}
                        {pageAdmin.map((page) => (
                            currentUser.rol === 'admin' &&
                            <Button
                                key={page.name}
                                href={page.url}
                                onClick={handleCloseNavMenu}
                                sx={{ my: 2, color: 'black', display: 'block', marginLeft: '10px' }}
                            >
                                {page.name}
                            </Button>
                        ))}
                        {(currentUser.rol === 'seguros' || currentUser.rol === 'admin') &&
                            pageSeguros.map((page) => (
                                <Button
                                    key={page.name}
                                    href={page.url}
                                    onClick={handleCloseNavMenu}
                                    sx={{ my: 2, color: 'black', display: 'block', marginLeft: '10px' }}
                                >
                                    {page.name}
                                </Button>
                            ))}
                        {currentUser?.rol === "max" &&
                            pageMax.map((page) => (
                                <Button
                                    key={page.name}
                                    href={page.url}
                                    onClick={handleCloseNavMenu}
                                    sx={{ my: 2, color: 'black', display: 'block', marginLeft: '10px' }}
                                >
                                    {page.name}
                                </Button>
                            ))}
                        {currentUser?.rol === "max-vendedor" &&
                            pageMaxVendedor.map((page) => (
                                <Button
                                    key={page.name}
                                    href={page.url}
                                    onClick={handleCloseNavMenu}
                                    sx={{ my: 2, color: 'black', display: 'block', marginLeft: '10px' }}
                                >
                                    {page.name}
                                </Button>
                            ))}
                        {currentUser?.rol === "nico" &&
                            pageNico.map((page) => (
                                <Button
                                    key={page.name}
                                    href={page.url}
                                    onClick={handleCloseNavMenu}
                                    sx={{ my: 2, color: 'black', display: 'block', marginLeft: '10px' }}
                                >
                                    {page.name}
                                </Button>
                            ))}
                        {currentUser?.rol === "nico-vendedor" &&
                            pageNicoVendedor.map((page) => (
                                <Button
                                    key={page.name}
                                    href={page.url}
                                    onClick={handleCloseNavMenu}
                                    sx={{ my: 2, color: 'black', display: 'block', marginLeft: '10px' }}
                                >
                                    {page.name}
                                </Button>
                            ))}
                    </Box>

                    <Box sx={{ flexGrow: 0 }}>
                        <Tooltip title="Menú">
                            <IconButton sx={{ p: 0 }} onClick={handleOpenUserMenu}>
                                <Avatar src="/broken-image.jpg" />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            sx={{ mt: '45px' }}
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                        >
                            {settings.map((setting) => (
                                <MenuItem key={setting} onClick={handleClickMenu}>
                                    <Typography textAlign="center">{setting}</Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    )
}

export default NavBar;
