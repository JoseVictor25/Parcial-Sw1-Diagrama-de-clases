import io
import zipfile
from .ai_docs import generate_ai_docs_for_class

def _map_type(uml_type):
    # Mapeo de tipos UML a Java
    t = (uml_type or "String").strip().lower()
    if t in ["int", "integer", "entero"]: return "Integer"
    if t in ["long", "bigint"]: return "Long"
    if t in ["bool", "boolean", "booleano"]: return "Boolean"
    if t in ["double", "float", "decimal", "real"]: return "Double"
    if t in ["bigdecimal", "dinero", "precio"]: return "java.math.BigDecimal"
    if t in ["date", "fecha", "localdate"]: return "java.time.LocalDate"
    if t in ["datetime", "timestamp", "localdatetime", "fechahora"]: return "java.time.LocalDateTime"
    if t in ["string", "str", "texto", "varchar", "char", "text"]: return "String"
    return "String"

def _capitalize(s):
    if not s: return ""
    return s[0].upper() + s[1:]

def _camel_case(s):
    if not s: return ""
    return s[0].lower() + s[1:]

def generate_spring_boot_zip(diagram_data: dict, group_id: str, artifact_id: str, project_name: str, include_ai_docs: bool) -> bytes:
    nodes = diagram_data.get("nodes", [])
    edges = diagram_data.get("edges", [])
    
    # Pre-procesar relaciones
    # relations[source_id] = [ {target_id, type} ]
    relations = {}
    for edge in edges:
        src = edge.get("source")
        tgt = edge.get("target")
        rel_type = edge.get("data", {}).get("relation_type", "association")
        
        # Ignorar si source o target son id's compuestos (como sourceHandle)
        # ReactFlow los manda como source="node_id"
        if src and tgt:
            if src not in relations:
                relations[src] = []
            relations[src].append({"target": tgt, "type": rel_type})
            
    # Mapear IDs de nodos a nombres de clase
    id_to_class = {n["id"]: _capitalize(n.get("data", {}).get("name", "Unknown")) for n in nodes}
    
    # Crear ZIP en memoria
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        
        base_path = f"{artifact_id}/src/main/java/{group_id.replace('.', '/')}/{artifact_id.replace('-', '').replace('.', '')}"
        pkg = f"{group_id}.{artifact_id.replace('-', '').replace('.', '')}"
        
        # 1. pom.xml
        pom_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.3</version>
    </parent>
    <groupId>{group_id}</groupId>
    <artifactId>{artifact_id}</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>{project_name}</name>
    <description>Proyecto generado desde el diagrama UML</description>
    <properties>
        <java.version>17</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.3.0</version>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>"""
        zip_file.writestr(f"{artifact_id}/pom.xml", pom_content)

        # 2. application.properties
        app_name = artifact_id if artifact_id else "hospital"
        app_props = f"""# ===================================================================
# Configuración del Servidor y Base de Datos PostgreSQL
# Generado automáticamente por UMLCraft
# ===================================================================
server.port=8080
spring.application.name={app_name}

# Configuración del DataSource para PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/
spring.datasource.username=
spring.datasource.password=
spring.datasource.driver-class-name=org.postgresql.Driver

# Configuración de Spring Data JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Configuración de Jackson para serialización JSON
spring.jackson.serialization.fail-on-empty-beans=false
"""
        zip_file.writestr(f"{artifact_id}/src/main/resources/application.properties", app_props)

        # 3. Main Application Class
        app_class = f"""package {pkg};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {{
    public static void main(String[] args) {{
        SpringApplication.run(Application.class, args);
    }}
}}
"""
        zip_file.writestr(f"{base_path}/Application.java", app_class)

        # 4. Generar Capas por cada Clase
        for node in nodes:
            data = node.get("data", {})
            class_name = _capitalize(data.get("name", "Unknown"))
            if not class_name or class_name == "Unknown": continue
            
            attributes = data.get("attributes", [])
            methods = data.get("methods", [])
            
            # Obtener AI docs si aplica
            ai_docs = {}
            if include_ai_docs:
                ai_params_attr = [{"name": a.get("name"), "type": a.get("data_type")} for a in attributes]
                ai_params_meth = [{"name": m.get("name"), "return_type": m.get("return_type")} for m in methods]
                ai_docs = generate_ai_docs_for_class(class_name, ai_params_attr, ai_params_meth, project_name)
                
            class_javadoc = ai_docs.get("class_javadoc", "")
            class_swagger = ai_docs.get("class_swagger", f'@Tag(name = "{class_name}")')
            attr_docs = ai_docs.get("attributes_docs", {})
            meth_docs = ai_docs.get("methods_docs", {})
            
            # -- ENTITY & DTO FIELDS --
            fields_java = ""
            mapper_to_dto = ""
            mapper_to_entity = ""
            for a in attributes:
                a_name = _camel_case(a.get("name", "field"))
                # Si el campo se llama 'id' o similar, se omite porque @Id private Long id ya se incluye por defecto
                if a_name.lower() in ["id", "codigo", f"id{class_name.lower()}", f"id_{class_name.lower()}"]:
                    continue
                a_type = _map_type(a.get("data_type", "String"))
                doc = attr_docs.get(a.get("name"), "")
                doc_str = f"    {doc}\n" if doc else ""
                fields_java += f"{doc_str}    private {a_type} {a_name};\n\n"
                
                cap = _capitalize(a_name)
                mapper_to_dto += f"        dto.set{cap}(entity.get{cap}());\n"
                mapper_to_entity += f"        entity.set{cap}(dto.get{cap}());\n"
            
            # Relaciones (simplificado: OneToMany / ManyToOne basado en flechas)
            rels_java = ""
            if node["id"] in relations:
                for rel in relations[node["id"]]:
                    tgt_name = id_to_class.get(rel["target"])
                    if tgt_name:
                        rels_java += f"    @ManyToOne\n    private {tgt_name} {tgt_name.lower()};\n\n"
            
            entity_code = f"""package {pkg}.entity;

import jakarta.persistence.*;
import lombok.Data;

{class_javadoc}
@Entity
@Data
public class {class_name} {{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

{fields_java}
{rels_java}
}}
"""
            zip_file.writestr(f"{base_path}/entity/{class_name}.java", entity_code)

            # -- DTO --
            dto_code = f"""package {pkg}.dto;

import lombok.Data;
import io.swagger.v3.oas.annotations.media.Schema;

{class_javadoc}
@Data
public class {class_name}DTO {{
    private Long id;
{fields_java}
}}
"""
            zip_file.writestr(f"{base_path}/dto/{class_name}DTO.java", dto_code)

            # -- MAPPER --
            mapper_code = f"""package {pkg}.mapper;

import {pkg}.entity.{class_name};
import {pkg}.dto.{class_name}DTO;
import org.springframework.stereotype.Component;

@Component
public class {class_name}Mapper {{
    public {class_name}DTO toDTO({class_name} entity) {{
        if (entity == null) return null;
        {class_name}DTO dto = new {class_name}DTO();
        dto.setId(entity.getId());
{mapper_to_dto}        return dto;
    }}

    public {class_name} toEntity({class_name}DTO dto) {{
        if (dto == null) return null;
        {class_name} entity = new {class_name}();
        entity.setId(dto.getId());
{mapper_to_entity}        return entity;
    }}
}}
"""
            zip_file.writestr(f"{base_path}/mapper/{class_name}Mapper.java", mapper_code)

            # -- REPOSITORY --
            repo_code = f"""package {pkg}.repository;

import {pkg}.entity.{class_name};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface {class_name}Repository extends JpaRepository<{class_name}, Long> {{
}}
"""
            zip_file.writestr(f"{base_path}/repository/{class_name}Repository.java", repo_code)

            # -- SERVICE --
            service_code = f"""package {pkg}.service;

import {pkg}.entity.{class_name};
import {pkg}.dto.{class_name}DTO;
import {pkg}.mapper.{class_name}Mapper;
import {pkg}.repository.{class_name}Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class {class_name}Service {{
    @Autowired
    private {class_name}Repository repository;
    @Autowired
    private {class_name}Mapper mapper;

    public List<{class_name}DTO> findAll() {{
        return repository.findAll().stream().map(mapper::toDTO).collect(Collectors.toList());
    }}

    public {class_name}DTO save({class_name}DTO dto) {{
        {class_name} entity = mapper.toEntity(dto);
        return mapper.toDTO(repository.save(entity));
    }}
    
    public void delete(Long id) {{
        repository.deleteById(id);
    }}
}}
"""
            zip_file.writestr(f"{base_path}/service/{class_name}Service.java", service_code)

            # -- CONTROLLER --
            controller_code = f"""package {pkg}.controller;

import {pkg}.dto.{class_name}DTO;
import {pkg}.service.{class_name}Service;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

{class_swagger}
@RestController
@RequestMapping("/api/{class_name.lower()}s")
public class {class_name}Controller {{
    @Autowired
    private {class_name}Service service;

    @Operation(summary = "Obtener todos", description = "Retorna una lista de {class_name}")
    @GetMapping
    public List<{class_name}DTO> getAll() {{
        return service.findAll();
    }}

    @Operation(summary = "Crear o actualizar", description = "Guarda un objeto {class_name}")
    @PostMapping
    public {class_name}DTO create(@RequestBody {class_name}DTO dto) {{
        return service.save(dto);
    }}

    @Operation(summary = "Eliminar", description = "Elimina un objeto {class_name} por ID")
    @DeleteMapping("/{{id}}")
    public void delete(@PathVariable Long id) {{
        service.delete(id);
    }}
}}
"""
            zip_file.writestr(f"{base_path}/controller/{class_name}Controller.java", controller_code)

    return zip_buffer.getvalue()
