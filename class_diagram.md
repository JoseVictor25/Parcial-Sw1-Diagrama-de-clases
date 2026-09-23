# Diagrama de Clases Definitivo del Sistema

Este es el modelo oficial de clases y base de datos definido para el sistema:

---

## 1. Código PlantUML (`.puml`)

```plantuml
@startuml Diagrama_Clases_UML

title Diagrama de Clases UML - Herramienta Colaborativa de Modelado

skinparam classAttributeIconSize 0
skinparam monochrome false
skinparam shadowing false
skinparam defaultFontName "Segoe UI", sans-serif

class Usuario {
  +id: int
  +nombre: string
  +email: string
  +password_hash: string
  +estado: string
  +fecha_registro: datetime
}

class Proyecto {
  +id: int
  +titulo: string
  +descripcion: string
  +fecha_creacion: datetime
  +fecha_actualizacion: datetime
  +datos_diagrama: json
}

class DetalleProyecto {
  +id: int
  +rol: string
  +fecha_asignacion: datetime
}

Usuario "1" -- "0..*" Proyecto : propietario >
Usuario "1" -- "0..*" DetalleProyecto : usuario >
Proyecto "1" -- "0..*" DetalleProyecto : proyecto >

@enduml
```

---

## 2. Código Mermaid

```mermaid
classDiagram
    direction TB

    class Usuario {
        +int id
        +string nombre
        +string email
        +string password_hash
        +string estado
        +datetime fecha_registro
    }

    class Proyecto {
        +int id
        +string titulo
        +string descripcion
        +datetime fecha_creacion
        +datetime fecha_actualizacion
        +json datos_diagrama
    }

    class DetalleProyecto {
        +int id
        +string rol
        +datetime fecha_asignacion
    }

    Usuario "1" -- "0..*" Proyecto : propietario >
    Usuario "1" -- "0..*" DetalleProyecto : usuario >
    Proyecto "1" -- "0..*" DetalleProyecto : proyecto >
```

---

## 3. Justificación del Modelo para el Parcial

1. **`Usuario`**: Gestiona la autenticación, seguridad y datos de los miembros del sistema.
2. **`Proyecto`**: Contiene la información del proyecto y almacena el estado visual completo del lienzo UML en el campo `datos_diagrama` (formato JSON de clases, atributos, métodos, coordenadas y flechas UML).
3. **`DetalleProyecto`**: Clase de asociación que resuelve la relación Muchos a Muchos entre `Usuario` y `Proyecto`, guardando el `rol` de cada colaborador (ej. editor, lector) y la fecha en que fue invitado.
