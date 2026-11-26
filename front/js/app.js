const API_URL = 'api';

let modalInstancia = null;

document.addEventListener('DOMContentLoaded', () => {
  const modalElemento = document.getElementById('modalPersonaje');
  modalInstancia = new bootstrap.Modal(modalElemento);

  cargarPersonajes();

  document.getElementById('btnNuevo').addEventListener('click', () => {
    limpiarFormulario();
    document.getElementById('modalTitulo').textContent = 'Registrar Nuevo Personaje';
  });

  document.getElementById('btnActualizar').addEventListener('click', () => {
    cargarPersonajes();
  });

  document.getElementById('formPersonaje').addEventListener('submit', async (e) => {
    e.preventDefault();
    await guardarPersonaje();
  });
});

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function limpiarFormulario() {
  document.getElementById('formPersonaje').reset();
  document.getElementById('id').value = '';
}

async function cargarPersonajes() {
  const tbody = document.getElementById('tablaPersonajes');
  const totalEl = document.getElementById('totalRegistros');

  try {
    const respuesta = await fetch(`${API_URL}/seleccionarTodos.php`);
    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const personajes = await respuesta.json();
    const lista = Array.isArray(personajes) ? personajes : [];

    totalEl.textContent = `${lista.length} ${lista.length === 1 ? 'registro' : 'registros'}`;

    if (lista.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-secondary py-4">
            No hay personajes registrados todavía. Haz clic en <strong>+ Nuevo Personaje</strong> para comenzar.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = lista.map((p) => `
      <tr>
        <td class="fw-bold text-info">${escaparHTML(p.id)}</td>
        <td class="fw-semibold">${escaparHTML(p.nombre)}</td>
        <td>${escaparHTML(p.videojuego)}</td>
        <td><span class="badge text-bg-secondary">${escaparHTML(p.genero)}</span></td>
        <td>${escaparHTML(p.plataforma)}</td>
        <td>${escaparHTML(p.habilidad)}</td>
        <td class="text-center">
          <div class="btn-group btn-group-sm" role="group">
            <button type="button" class="btn btn-outline-warning" onclick="editarPersonaje(${Number(p.id)})">
              Editar
            </button>
            <button type="button" class="btn btn-outline-danger" onclick="eliminarPersonaje(${Number(p.id)}, '${escaparHTML(p.nombre).replace(/'/g, "\\'")}')">
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger py-4">
          No se pudo conectar con la base de datos (${escaparHTML(error.message)}).
        </td>
      </tr>`;
  }
}

async function guardarPersonaje() {
  const id = document.getElementById('id').value.trim();
  const datos = {
    nombre: document.getElementById('nombre').value.trim(),
    videojuego: document.getElementById('videojuego').value.trim(),
    genero: document.getElementById('genero').value.trim(),
    plataforma: document.getElementById('plataforma').value.trim(),
    habilidad: document.getElementById('habilidad').value.trim()
  };

  if (!datos.nombre || !datos.videojuego || !datos.genero || !datos.plataforma || !datos.habilidad) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos incompletos',
      text: 'Completa todos los campos obligatorios antes de guardar.',
      background: '#16181d',
      color: '#f8f9fa'
    });
    return;
  }

  const endpoint = id ? 'actualizar.php' : 'agregar.php';
  if (id) {
    datos.id = Number(id);
  }

  try {
    const respuesta = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok || resultado.error) {
      throw new Error(resultado.error || 'No se pudo procesar la operación');
    }

    modalInstancia.hide();
    limpiarFormulario();
    await cargarPersonajes();

    Swal.fire({
      icon: 'success',
      title: id ? 'Personaje actualizado' : 'Personaje registrado',
      text: resultado.mensaje || 'Los datos se guardaron correctamente en MySQL.',
      timer: 1800,
      showConfirmButton: false,
      background: '#16181d',
      color: '#f8f9fa'
    });
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error al guardar',
      text: error.message,
      background: '#16181d',
      color: '#f8f9fa'
    });
  }
}

async function editarPersonaje(id) {
  try {
    const respuesta = await fetch(`${API_URL}/seleccionar.php?id=${encodeURIComponent(id)}`);
    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const data = await respuesta.json();
    const personaje = Array.isArray(data) ? data[0] : data;

    if (!personaje || !personaje.id) {
      throw new Error('No se encontró el personaje seleccionado.');
    }

    document.getElementById('id').value = personaje.id;
    document.getElementById('nombre').value = personaje.nombre;
    document.getElementById('videojuego').value = personaje.videojuego;
    document.getElementById('genero').value = personaje.genero;
    document.getElementById('plataforma').value = personaje.plataforma;
    document.getElementById('habilidad').value = personaje.habilidad;

    document.getElementById('modalTitulo').textContent = 'Editar Personaje';
    modalInstancia.show();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error al cargar datos',
      text: error.message,
      background: '#16181d',
      color: '#f8f9fa'
    });
  }
}

async function eliminarPersonaje(id, nombre) {
  const confirmacion = await Swal.fire({
    icon: 'warning',
    title: `¿Eliminar a ${nombre}?`,
    text: 'Esta acción borrará el registro de la base de datos.',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    background: '#16181d',
    color: '#f8f9fa'
  });

  if (!confirmacion.isConfirmed) {
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/eliminar.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: Number(id) })
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok || resultado.error) {
      throw new Error(resultado.error || 'No se pudo eliminar el registro');
    }

    await cargarPersonajes();

    Swal.fire({
      icon: 'success',
      title: 'Eliminado',
      text: resultado.mensaje || 'El personaje fue eliminado correctamente.',
      timer: 1600,
      showConfirmButton: false,
      background: '#16181d',
      color: '#f8f9fa'
    });
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error al eliminar',
      text: error.message,
      background: '#16181d',
      color: '#f8f9fa'
    });
  }
}