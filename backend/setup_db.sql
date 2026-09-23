-- ==============================================================================
-- Script DDL de Base de Datos para el Sistema Colaborativo UML (PostgreSQL)
-- Modelo Definitivo: Usuario, Proyecto, DetalleProyecto
-- ==============================================================================

-- 1. Crear base de datos (ejecutar conectado a postgres)
-- CREATE DATABASE uml_collaborative_db;
-- \c uml_collaborative_db;

-- 2. Tabla Usuario
CREATE TABLE IF NOT EXISTS usuario (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    estado VARCHAR(50) DEFAULT 'activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla Proyecto
CREATE TABLE IF NOT EXISTS proyecto (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    propietario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datos_diagrama JSONB DEFAULT '{}'::jsonb
);

-- 4. Tabla DetalleProyecto (Colaboradores y roles por proyecto)
CREATE TABLE IF NOT EXISTS detalle_proyecto (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    rol VARCHAR(50) DEFAULT 'editor',
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_proyecto_usuario UNIQUE (proyecto_id, usuario_id)
);

-- Índices recomendados para optimización
CREATE INDEX IF NOT EXISTS idx_proyecto_propietario ON proyecto(propietario_id);
CREATE INDEX IF NOT EXISTS idx_detalle_proyecto ON detalle_proyecto(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_detalle_usuario ON detalle_proyecto(usuario_id);
