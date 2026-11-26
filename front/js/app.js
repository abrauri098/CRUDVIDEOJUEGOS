// Cambia esta URL por la de tu hosting en AwardSpace cuando subas el backend (ej. 'https://tusitio.atwebpages.com/api')
const API_URL = 'api';

const tablaPersonajes = document.getElementById('tablaPersonajes');
const contadorPersonajes = document.getElementById('contadorPersonajes');
const formAgregar = document.getElementById('formAgregar');
const formEditar = document.getElementById('formEditar');

document.addEventListener('DOMContentLoaded', () => {
    cargarPersonajes();
});

// 1. GET - Seleccionar todos los personajes
async function cargarPersonajes() {
    try {
        const respuesta = await fetch(`${API_URL}/seleccionarTodos.php`);
        const personajes = await respuesta.json();

        contadorPersonajes.textContent = `${personajes.length} ${personajes.length === 1 ? 'registro' : 'registros'}`;
        tablaPersonajes.innerHTML = '';

        if (personajes.length === 0) {
            tablaPersonajes.innerHTML = `
                <tr>
                    <td colspan="7" class="text-body-secondary py-5">No hay personajes registrados todavía. Haz clic en <strong>+ Nuevo Personaje</strong> para comenzar.</td>
                </tr>
            `;
            return;
        }

        personajes.forEach(p => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td class="fw-bold text-body-secondary">#${p.id}</td>
                <td class="text-start fw-semibold">${p.nombre}</td>
                <td>${p.videojuego}</td>
                <td><span class="badge text-bg-info rounded-pill px-3">${p.genero}</span></td>
                <td><span class="badge text-bg-secondary rounded-pill px-3">${p.plataforma}</span></td>
                <td>${p.habilidad}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-warning fw-semibold" onclick="abrirModalEditar(${p.id})">
                            Editar
                        </button>
                        <button type="button" class="btn btn-outline-danger fw-semibold" onclick="eliminarPersonaje(${p.id}, '${p.nombre.replace(/'/g, "\\'")}')">
                            Eliminar
                        </button>
                    </div>
                </td>
            `;
            tablaPersonajes.appendChild(fila);
        });
    } catch (error) {
        console.error('Error al cargar personajes:', error);
        tablaPersonajes.innerHTML = `
            <tr>
                <td colspan="7" class="text-danger py-4">No se pudo conectar con <code>api/seleccionarTodos.php</code>.</td>
            </tr>
        `;
    }
}

// 2. POST - Agregar nuevo personaje
formAgregar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuevoPersonaje = {
        nombre: document.getElementById('nombre').value.trim(),
        videojuego: document.getElementById('videojuego').value.trim(),
        genero: document.getElementById('genero').value,
        plataforma: document.getElementById('plataforma').value,
        habilidad: document.getElementById('habilidad').value.trim()
    };

    try {
        const respuesta = await fetch(`${API_URL}/agregar.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoPersonaje)
        });

        const resultado = await respuesta.json();

        if (resultado.exito) {
            bootstrap.Modal.getInstance(document.getElementById('modalAgregar')).hide();
            formAgregar.reset();

            await Swal.fire({
                icon: 'success',
                title: '¡Personaje agregado!',
                text: resultado.mensaje,
                timer: 1500,
                showConfirmButton: false
            });

            cargarPersonajes();
        } else {
            Swal.fire('Error', resultado.mensaje || 'No se pudo guardar el personaje.', 'error');
        }
    } catch (error) {
        console.error('Error al agregar:', error);
        Swal.fire('Error de red', 'No se pudo conectar con agregar.php', 'error');
    }
});

// 3. GET (por ID) - Seleccionar un personaje para editar
async function abrirModalEditar(id) {
    try {
        const respuesta = await fetch(`${API_URL}/seleccionar.php?id=${id}`);
        const personaje = await respuesta.json();

        if (personaje && personaje.id) {
            document.getElementById('editId').value = personaje.id;
            document.getElementById('editNombre').value = personaje.nombre;
            document.getElementById('editVideojuego').value = personaje.videojuego;
            document.getElementById('editGenero').value = personaje.genero;
            document.getElementById('editPlataforma').value = personaje.plataforma;
            document.getElementById('editHabilidad').value = personaje.habilidad;

            const modalEditar = new bootstrap.Modal(document.getElementById('modalEditar'));
            modalEditar.show();
        } else {
            Swal.fire('Aviso', 'No se encontró la información del personaje.', 'warning');
        }
    } catch (error) {
        console.error('Error al seleccionar personaje:', error);
        Swal.fire('Error de red', 'No se pudo consultar seleccionar.php', 'error');
    }
}

// 4. PUT - Actualizar personaje existente
formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const personajeActualizado = {
        id: document.getElementById('editId').value,
        nombre: document.getElementById('editNombre').value.trim(),
        videojuego: document.getElementById('editVideojuego').value.trim(),
        genero: document.getElementById('editGenero').value,
        plataforma: document.getElementById('editPlataforma').value,
        habilidad: document.getElementById('editHabilidad').value.trim()
    };

    try {
        const respuesta = await fetch(`${API_URL}/actualizar.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(personajeActualizado)
        });

        const resultado = await respuesta.json();

        if (resultado.exito) {
            bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();

            await Swal.fire({
                icon: 'success',
                title: '¡Actualizado!',
                text: resultado.mensaje,
                timer: 1500,
                showConfirmButton: false
            });

            cargarPersonajes();
        } else {
            Swal.fire('Error', resultado.mensaje || 'No se pudo actualizar el registro.', 'error');
        }
    } catch (error) {
        console.error('Error al actualizar:', error);
        Swal.fire('Error de red', 'No se pudo conectar con actualizar.php', 'error');
    }
});

// 5. DELETE - Eliminar personaje con confirmación SweetAlert2
async function eliminarPersonaje(id, nombre) {
    const confirmacion = await Swal.fire({
        title: `¿Eliminar a ${nombre}?`,
        text: 'Esta acción eliminará el registro de la base de datos.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        const respuesta = await fetch(`${API_URL}/eliminar.php`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });

        const resultado = await respuesta.json();

        if (resultado.exito) {
            await Swal.fire({
                icon: 'success',
                title: '¡Eliminado!',
                text: resultado.mensaje,
                timer: 1500,
                showConfirmButton: false
            });

            cargarPersonajes();
        } else {
            Swal.fire('Error', resultado.mensaje || 'No se pudo eliminar el personaje.', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
        Swal.fire('Error de red', 'No se pudo conectar con eliminar.php', 'error');
    }
}