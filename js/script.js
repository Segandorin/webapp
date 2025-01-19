import { firebaseConfig } from './auth.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore, collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc , setDoc, query, deleteField, orderBy} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// Inicializar Firebase
const app = initializeApp(firebaseConfig); 
const auth = getAuth(app);  
const db = getFirestore(app);

// Variables de referencia
const containerLoggin = document.getElementById("containerLoggin");
const containerMain = document.getElementById("containerMain");
const inputBuscar = document.getElementById('inputBuscar');
const tablaGastos = document.getElementById('tablaGastos');
const offcanvasElement = document.getElementById('offcanvas');
const offcanvas = new bootstrap.Offcanvas(offcanvasElement);

const btnAutentificar = document.getElementById("btnAutentificar");
const btnNuevo = document.getElementById('btnNuevo');
const btnMenu = document.getElementById('btnMenu');
const btnResumen = document.getElementById('btnResumen');
const btnNotas = document.getElementById('btnNotas');
const btnGuardar = document.getElementById('btnGuardar');
const btnEliminar = document.getElementById('btnEliminar');

const inputEmail = document.getElementById('inputEmail');
const inputPassword = document.getElementById('inputPassword');
const inputId = document.getElementById('inputId');
const inputNombre = document.getElementById('inputNombre');
const inputFecha = document.getElementById('inputFecha');
const inputTipo = document.getElementById('inputTipo');
const inputDescripcion = document.getElementById('inputDescripcion');
const inputCantidad = document.getElementById('inputCantidad');


let gastosData = [];
let gastosNotasData = [];


//----------------------------------------------------------------------------------------------------------->>>
//-------- DOM LISTENERS ------------------------------------------------------------------------------------>>>
//----------------------------------------------------------------------------------------------------------->>>
document.addEventListener("DOMContentLoaded", function() {

    btnAutentificar.addEventListener("click", function() {
        validarYAcceder();
    }) 

    btnMenu.addEventListener("click", function() {
        limpiarBodyCanvas ();
        cargarResumen();
        cargarTablaGastos();
    })
    
    btnNuevo.addEventListener("click", function() {
        borrarValorInputs();
        fechaActual();
    });
    
    btnResumen.addEventListener("click", function() {
        limpiarBodyCanvas ();
        cargarResumen();
    })
    
    btnNotas.addEventListener("click", function() {
        limpiarBodyCanvas ();
        cargarNotas();
    })
    
    btnGuardar.addEventListener("click", function() {
        mostrarAviso('¿Estás seguro de guardar?', verificarGuardado);
    });
    
    btnEliminar.addEventListener("click", function() {
        mostrarAviso('¿Estás seguro de eliminar?', eliminarGasto);
    });
    
    document.querySelector('.container-canvas').addEventListener('click', function(event) { // ---- Desliza scroll al pulsar dentro de CANVAS
        var clickY = event.clientY;
        var canvasHeight = this.clientHeight;
        var scrollToPosition = clickY - (canvasHeight / 2);
    
        this.scrollTo({
            top: scrollToPosition,
            behavior: 'smooth'
        });
    });
    
    document.getElementById('resultadosNotas').addEventListener('click', function(event) {
        if (event.target && event.target.matches('.btnAñadirNota')) {
            mostrarAviso('¿Estás seguro de añadir?', añadirNota);
        }
    
        if (event.target && event.target.matches('.btnBorrarNota')) {
            var dataId = event.target.getAttribute('data-id');
            mostrarAviso('¿Estás seguro de eliminar?', function() {
                eliminarNota(dataId);
            });
        }
    }); 
});

//---------------------------------------------------------------------------------------------------------------------->>>
//-------- Funciones --------------------------------------------------------------------------------------------------->>>
//---------------------------------------------------------------------------------------------------------------------->>>
async function validarYAcceder() {
    const email = inputEmail.value;
    const password = inputPassword.value;

    // Validar que ambos campos no estén vacíos
    if (email && password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            containerLoggin.style.display = "none";
            containerMain.style.visibility = "visible";
            containerMain.style.opacity = "1";
            containerMain.style.display = "block";

            // Cargar los datos de Firestore
            await cargarDatos();
            cargarTablaGastos();

            // console.log("gastosData:", gastosData);
            // console.log("gastosNotasData:", gastosNotasData);

        } catch (error) {
            // console.error('Error de login:', error);
            // alert("Error: Email o contraseña son incorrectos");
        }
    }
}

const cargarDatos = async () => {
    try {
        // Cargar datos de la colección "GastosDataFirebase"
        const querySnapshotGastosData = await getDocs(collection(db, "GastosDataFirebase"));
        querySnapshotGastosData.docs.forEach((doc) => {
            gastosData[doc.id] = doc.data();
        });

        // Cargar datos de la colección "GastosNotasDataFirebase"
        const querySnapshotGastosNotasData = await getDocs(collection(db, "GastosNotasDataFirebase"));
        querySnapshotGastosNotasData.docs.forEach((doc) => {
            gastosNotasData[doc.id] = doc.data();
        });
        
    } catch (error) {
        console.error("Error al cargar los datos: ", error);
    }
};
;

//-------- G A S T O --------------------------------------------------------------------------------->>>
async function añadirGasto() {
    const fechaInput = inputFecha.value;  
    const [dia, mes, año] = fechaInput.split('/').map(Number);
    const fechaUsuario = new Date(año, mes - 1, dia);
    const fechaLocalEspana = new Date();
    const id = `${fechaUsuario.getFullYear()}-${(fechaUsuario.getMonth() + 1).toString().padStart(2, '0')}-${fechaUsuario.getDate().toString().padStart(2, '0')}T${fechaLocalEspana.getHours().toString().padStart(2, '0')}:${fechaLocalEspana.getMinutes().toString().padStart(2, '0')}:${fechaLocalEspana.getSeconds().toString().padStart(2, '0')}.${fechaLocalEspana.getMilliseconds().toString().padStart(3, '0')}`;

    const nombre = inputNombre.value;
    const tipo = inputTipo.value;
    const descripcion = inputDescripcion.value;
    const cantidad = inputCantidad.value;

    
    try {
        const nuevoGasto = {
            nombre: nombre,
            fecha: fechaInput,  // La fecha tal como la ingresó el usuario
            tipo: tipo,
            descripcion: descripcion,
            cantidad: cantidad
        };

        // Usamos doc() para especificar la ID del documento
        const gastoRef = doc(db, "GastosDataFirebase", id);

        // Guardamos el nuevo gasto con la ID personalizada
        await setDoc(gastoRef, nuevoGasto);

        gastosData[id] = nuevoGasto;

        cargarTablaGastos(); 

    } catch (error) {
        console.error("Error al añadir el gasto:", error);
    }
}

async function actualizarGasto() {
    const id = inputId.value;
    const nombre = inputNombre.value;
    const fecha = inputFecha.value;
    const tipo = inputTipo.value;
    const descripcion = inputDescripcion.value;
    const cantidad = inputCantidad.value;

    try {
        const gastoRef = doc(db, "GastosDataFirebase", id); 
        const gastoDoc = await getDoc(gastoRef);

        if (!gastoDoc.exists()) {
            console.log("El gasto que intentas actualizar no existe.");
            return;  
        }

        // Si la fecha ha cambiado, generamos una nueva ID con hora fija
        const [dia, mes, año] = fecha.split('/').map(Number);
        const fechaUsuario = new Date(año, mes - 1, dia);

        // Usamos una hora fija de 00:01:01.111
        const nuevaId = `${fechaUsuario.getFullYear()}-${(fechaUsuario.getMonth() + 1).toString().padStart(2, '0')}-${fechaUsuario.getDate().toString().padStart(2, '0')}T00:01:01.111`;

        if (nuevaId !== id) {
            await deleteDoc(gastoRef); 

            // Crear nuevo documento con nueva ID
            const nuevoGasto = {
                nombre: nombre,
                fecha: fecha,
                tipo: tipo,
                descripcion: descripcion,
                cantidad: cantidad
            };

            const nuevoGastoRef = doc(db, "GastosDataFirebase", nuevaId);
            await setDoc(nuevoGastoRef, nuevoGasto);

    
            delete gastosData[id];  // Eliminar el gasto con la ID antigua
            gastosData[nuevaId] = { id: nuevaId, ...nuevoGasto };  // Añadir el nuevo gasto con la nueva ID
        } else {
            // Si la fecha no ha cambiado, solo actualizamos el documento con la misma ID
            await updateDoc(gastoRef, {
                nombre: nombre,
                fecha: fecha,
                tipo: tipo,
                descripcion: descripcion,
                cantidad: cantidad
            });

            gastosData[id] = { id, nombre, fecha, tipo, descripcion, cantidad };
        }

        cargarTablaGastos();  

    } catch (error) {
        console.error("Error al actualizar el gasto:", error);
    }
}

async function eliminarGasto() {
    const id = inputId.value; 

    try {
        const gastoRef = doc(db, "GastosDataFirebase", id); 
        const gastoDoc = await getDoc(gastoRef);

        if (!gastoDoc.exists()) {
            console.log("El gasto no existe.");
            return; 
        }

        await deleteDoc(gastoRef); // Eliminar el documento en Firebase

        if (gastosData.hasOwnProperty(id)) { // ---- // Eliminar el gasto del let gastoDato
            delete gastosData[id]; 
        }

        cargarTablaGastos();

    } catch (error) {
        console.error("Error al eliminar el gasto:", error);
    }
}


function fechaActual() {
    const inputFecha = document.getElementById('inputFecha');
    
    if (inputFecha.value.trim() === '') {
    const hoy = new Date();
    const dia = hoy.getDate().toString().padStart(2, '0');
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const ano = hoy.getFullYear();

    inputFecha.value = `${dia}/${mes}/${ano}`;
    }
}

function borrarValorInputs() {
    const inputs = [inputId, inputNombre, inputFecha, inputTipo, inputDescripcion, inputCantidad];
    inputs.forEach(input => input.value = '');
}

function verificarGuardado() {
    const id = inputId.value;

    if (id) {
        actualizarGasto();
    } else {
        añadirGasto();
    }
}

//-------- R E S U M E N ----------------------------------------------------------------------------->>>
function calculosResumen(gastosData) {
    const palabrasClaves = ["Víctor", "Sandra", "Alquiler", "Luz", "Agua", "Gas", "Internet", "Comida", "Gatos", "Capricho", "Hogar"];
    const resultados = {}; 
    const hoy = new Date();

    let mesActual = hoy.getMonth(); 
    let añoActual = hoy.getFullYear();

    for (let i = 0; i < 13; i++) {
        const mesFiltro = (mesActual - i + 12) % 12; 
        const añoFiltro = mesActual - i < 0 ? añoActual - 1 : añoActual;
        const mesNombre = new Date(añoFiltro, mesFiltro)
            .toLocaleString('es-ES', { month: 'long', year: 'numeric' })
            .replace(' de ', ' ');
        resultados[mesNombre] = {};  

        let totalVictor = 0; 
        let totalSandra = 0; 
        let totalAlquiler = 0; 
        let totalLuz = 0; 
        let totalAgua = 0; 
        let totalGas = 0; 
        let totalInternet = 0;
        let totalComida = 0;
        let totalGatos = 0;
        let totalCapricho = 0;
        let totalHogar = 0;
    
        palabrasClaves.forEach(palabraClave => {
            let totalCantidad = 0;

            // Iterar sobre los "hijos" de cada documento de  let gastosData
            Object.values(gastosData).forEach(gasto => {
                const [dia, mes, año] = gasto.fecha.split('/').map(Number);
                // Verificar si el gasto contiene la palabra clave y si la fecha es del mes y año deseados
                if ((gasto.nombre.toLowerCase().includes(palabraClave.toLowerCase()) ||
                    gasto.tipo.toLowerCase().includes(palabraClave.toLowerCase())) &&
                    mes === mesFiltro + 1 &&
                    año === añoFiltro) {
                    totalCantidad += parseFloat(gasto.cantidad.replace(',', '.'));
                }
            });

            // Asignar los resultados correspondientes
            if (palabraClave === "Víctor") totalVictor = totalCantidad;
            if (palabraClave === "Sandra") totalSandra = totalCantidad;
            if (palabraClave === "Alquiler") totalAlquiler = totalCantidad;
            if (palabraClave === "Luz") totalLuz = totalCantidad;
            if (palabraClave === "Agua") totalAgua = totalCantidad;
            if (palabraClave === "Gas") totalGas = totalCantidad;
            if (palabraClave === "Internet") totalInternet = totalCantidad;
            if (palabraClave === "Comida") totalComida = totalCantidad;
            if (palabraClave === "Gatos") totalGatos = totalCantidad;
            if (palabraClave === "Capricho") totalCapricho = totalCantidad;
            if (palabraClave === "Hogar") totalHogar = totalCantidad;
        });

        // --- Facturas divididas entre 2
        const mitadAlquiler =  totalAlquiler / 2 ;
        const mitadLuz =  totalLuz / 2 ;
        const mitadAgua =  totalAgua / 2 ;
        const mitadGas =  totalGas / 2 ;
        const mitadInternet =  totalInternet / 2 ;

        const diferencia = Math.abs(totalSandra - totalVictor);
        const totalGastos = totalVictor + totalSandra + totalAlquiler + totalLuz + totalAgua + totalGas + totalInternet;
        
        // Ahora guardas los totales acumulados
        resultados[mesNombre]["Alquiler"] = formatDecimal(mitadAlquiler);
        resultados[mesNombre]["Luz"] = formatDecimal(mitadLuz);
        resultados[mesNombre]["Agua"] = formatDecimal(mitadAgua);
        resultados[mesNombre]["Gas"] = formatDecimal(mitadGas);
        resultados[mesNombre]["Internet"] = formatDecimal(mitadInternet);

        resultados[mesNombre]["Comida"] = formatDecimal(totalComida);
        resultados[mesNombre]["Gatos"] = formatDecimal(totalGatos);
        resultados[mesNombre]["Capricho"] = formatDecimal(totalCapricho);
        resultados[mesNombre]["Hogar"] = formatDecimal(totalHogar);

        resultados[mesNombre]["Víctor"] = formatDecimal(totalVictor);
        resultados[mesNombre]["Sandra"] = formatDecimal(totalSandra);
        resultados[mesNombre]["Diferencia"] = formatDecimal(diferencia);
        resultados[mesNombre]["Total"] = formatDecimal(totalGastos);
    }

    return resultados;
}

function formatDecimal(num) {
    let resultado = num.toFixed(3).replace('.', ',');
    if (resultado.endsWith(',00')) return resultado.slice(0, -3);
    if (resultado.endsWith(',0')) return resultado.slice(0, -1);
    if (resultado.includes(',') && resultado.charAt(resultado.length - 1) === '0') {
        return resultado.slice(0, -1);
    }
    return resultado;
}

//-------- N O T A S --------------------------------------------------------------------------------->>>
async function añadirNota() {
    const inputNota = document.getElementById('inputNota').value;

    try {
        // Obtener la fecha local con milisegundos
        const fechaLocalEspana = new Date();
        const offset = fechaLocalEspana.getTimezoneOffset() * 60000;
        const fechaLocalAjustada = new Date(fechaLocalEspana.getTime() - offset); 

        // Asegurarnos de que la fecha está en el formato correcto (YYYY-MM-DDTHH:MM:SS.mmm)
        const timestamp = fechaLocalAjustada.toISOString().replace('Z', '');

        const nuevaNota = {
            nota: inputNota,
        };

        const docRef = doc(collection(db, "GastosNotasDataFirebase"), timestamp);

        await setDoc(docRef, nuevaNota);

        gastosNotasData[timestamp] = { id: timestamp, ...nuevaNota };

        cargarNotas();

    } catch (error) {
        console.error("Error al añadir nota:", error);
    }
}

async function eliminarNota(id) {
    try {
        const docRef = doc(db, "GastosNotasDataFirebase", id);
        await deleteDoc(docRef);

        delete gastosNotasData[id];

        cargarNotas();
        
    } catch (error) {
        console.error("Error al eliminar nota:", error);
    }
}

//-------- A V I S O --------------------------------------------------------------------------------->>>
function mostrarAviso(mensaje, funcionSi) {
    var modalAlerta = new bootstrap.Modal(document.getElementById('modalAlerta'));
    var textoPersonalizado = document.getElementById('textoPersonalizado');
    var btnSi = document.getElementById('btnAlertaSi');
    var btnNo = document.getElementById('btnAlertaNo');

    textoPersonalizado.innerHTML = mensaje;

    vibracion();
    modalAlerta.show();

    btnSi.onclick = function () {
        if (funcionSi && typeof funcionSi === "function") {
            funcionSi();
        }
        modalAlerta.hide();  
    };

    btnNo.onclick = function () {
        modalAlerta.hide();  
    };
}

function vibracion() {
    navigator.vibrate(50);
}

//-------- O T R O S --------------------------------------------------------------------------------->>>
function limpiarBodyCanvas () {
    const contenedorResumen = document.getElementById('resultadosResumen');
    const contenedorNotas = document.getElementById('resultadosNotas');

    contenedorResumen.innerHTML = '';
    contenedorNotas.innerHTML = '';
}

//---------------------------------------------------------------------------------------------------------------------->>>
//-------- Funciones dinámicas ----------------------------------------------------------------------------------------->>>
//---------------------------------------------------------------------------------------------------------------------->>>
function cargarTablaGastos() {
    if (tablaGastos.tabulator) {
        tablaGastos.tabulator.destroy();
    }

    let gastosDataOrdenados = Object.entries(gastosData) // ---- / Importa los datos de LET GASTOSDATA y los ordena de forma descendente 
    .sort((a, b) => b[0].localeCompare(a[0]))  
    .map(([id, data]) => ({ ...data, id }));

    const tabla = new Tabulator("#tablaGastos", {
        data: gastosDataOrdenados,  
        layout: "fitColumns",
        pagination: false,
        responsiveLayout: "hide",
        placeholder: "No se encontraron resultados",
        columns: [
            {title: "ID", field: "id", visible: false},  
            {
                title: "Nombre",
                field: "nombre",
                headerSort: false,
                formatter: function(cell) {
                    var nombre = cell.getData().nombre;
                    var fecha = cell.getData().fecha;
                    return "<div class='estiloNombre'>" + nombre + "</div>" + "<div class='estiloFecha'>" + fecha + "</div>"; 
                }
            },
            {
                title: "Tipo",
                field: "tipo",
                headerSort: false,
                formatter: function(cell) {
                    var tipo = cell.getData().tipo;
                    var descripcion = cell.getData().descripcion;
                    return tipo + "<br><div class='estiloDescripcion'>" + "- " + descripcion + " -" + "</div>";
                }
            },
            {
                title: "Cantidad",
                field: "cantidad",
                headerSort: false,
                headerHozAlign: "center",
                formatter: function(cell) {
                    var cantidad = cell.getData().cantidad;
                    return "<div class='estiloCantidad'>" + "- " + cantidad + "€</div>";
                }
            }
        ],
    });
    tabla.on("rowDblClick", function(e, row) {
        const data = row.getData();  
        
        document.getElementById("inputId").value = data.id;
        document.getElementById("inputNombre").value = data.nombre;
        document.getElementById("inputFecha").value = data.fecha;
        document.getElementById("inputTipo").value = data.tipo;
        document.getElementById("inputDescripcion").value = data.descripcion;
        document.getElementById("inputCantidad").value = data.cantidad;
        
        offcanvas.show();
    });

    document.getElementById("inputBuscar").addEventListener("input", function() {
        var query = this.value.toLowerCase();
        
        tabla.setFilter(function(gastosData) {
            for (var key in gastosData) {
                if (gastosData[key] && gastosData[key].toString().toLowerCase().includes(query)) {
                    return true;  
                }
            }
            return false; 
        });
    });
    
}

function cargarResumen() {
    var resultados = calculosResumen(gastosData); 
    const contenedor = document.getElementById('resultadosResumen');
    contenedor.innerHTML = ''; 
    btnResumen.checked = true; // -------- Mantiene btn Resumen pulsado

    Object.keys(resultados).forEach(mes => {
        const datos = resultados[mes];

        let html = `
                <div class="container-global ">

                    <div class="seccion-superior">
                        <span class="label">${mes.toUpperCase()}</span>
                        <span class="value">${datos["Total"]}€</span> 
                    </div>

                    <div class="seccion-inferior">
                        <div class="seccion-inferior-izquierda">

                            <div class="form-group"> 
                                <span class="label"><span class="material-symbols-outlined">location_away</span></span>
                                <span class="value">${datos["Alquiler"]}€</span> 
                            </div>

                            <div class="form-group">
                                <span class="label"><span class="material-symbols-outlined">emoji_objects</span></span>
                                <span class="value">${datos["Luz"]}€</span> 
                            </div>

                            <div class="form-group">
                                <span class="label"><span class="material-symbols-outlined">opacity</span></span>
                                <span class="value">${datos["Agua"]}€</span> 
                            </div>

                            <div class="form-group">
                                <span class="label"><span class="material-symbols-outlined">local_fire_department</span></span>
                                <span class="value">${datos["Gas"]}€</span> 
                            </div>

                            <div class="form-group">
                                <span class="label"><span class="material-symbols-outlined">wifi</span></span>
                                <span class="value">${datos["Internet"]}€</span> 
                            </div>
                        </div>
                    

                        <div class="seccion-inferior-derecha">
                            <span class="label-titulo">General</span>

                            <div class="form-group">
                                <span class="label">Comida</span>
                                <span class="value">${datos["Comida"]}€</span>
                            </div>

                            <div class="form-group">
                                <span class="label">Gatos</span>
                                <span class="value">${datos["Gatos"]}€</span>
                            </div>

                            <div class="form-group">
                                <span class="label">Capricho</span>
                                <span class="value">${datos["Capricho"]}€</span>
                            </div>

                            <div class="form-group">              
                                <span class="label">Hogar</span>
                                <span class="value">${datos["Hogar"]}€</span>
                            </div>

                            <span class="label-titulo">Detalles</span>
                            <div class="form-group">
                                <span class="label">Sandra</span>
                                <span class="value">${datos["Sandra"]}€</span>
                            </div>

                            <div class="form-group">
                                <span class="label">Víctor</span>
                                <span class="value">${datos["Víctor"]}€</span>
                            </div>

                            <div class="form-group">
                                <span class="label">Diferencia</span>
                                <span class="value">${datos["Diferencia"]}€</span>
                            </div>
                            
                        </div>
                    </div>
                </div>
            `;

        contenedor.innerHTML += html; 
    });
}

function cargarNotas() {
    const contenedor = document.getElementById('resultadosNotas');
    contenedor.innerHTML = ''; 

    let contenedorGeneral = `
        <div class="container-notas">
            <div class="form-group-header">
                <input type="text" class="form-control" id="inputNota">
                <button class="btn-custom btnAñadirNota" type="button">Añadir</button>
            </div>
            <br>
            <div class="form-group-contenido">
    `;

    Object.entries(gastosNotasData).forEach(([id, datos]) => {
        let notaHTML = `
            <div class="form-group">
                <span class="value">${datos.nota}</span>
                <i class="bi bi-x-circle btnBorrarNota" data-id="${id}"></i>
            </div>
            <hr>
        `;

        contenedorGeneral += notaHTML; 
    });

    contenedorGeneral += `
            </div> 
        </div> 
    `;

    contenedor.innerHTML += contenedorGeneral;
}

