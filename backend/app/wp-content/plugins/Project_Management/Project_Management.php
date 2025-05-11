<?php
/*
Plugin Name: Project Management
Plugin URI: 
Description: Un plugin para gestión de proyectos en WordPress.
Version: 1.0.0
Author: Ramón Moreno 
Author URI: https://tusitio.com
License: GPL2
Text Domain: project-management
*/

// Evitar el acceso directo al archivo              
if (!defined('ABSPATH')) {
    exit;
}

// Definir constantes
define('PM_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('PM_PLUGIN_URL', plugin_dir_url(__FILE__));
define('PM_PLUGIN_VERSION', '1.0.0');

// Incluir el archivo para el registro de usuarios
include_once PM_PLUGIN_DIR . 'includes/PM_custon_user_register.php';


// =============================================
// REGISTRO DE POST TYPE Y META CAMPOS
// =============================================

// Registrar Custom Post Type 'Proyectos'
function PM_register_project_post_type() {
    $labels = array(
        'name'                  => _x('Proyectos', 'Post Type General Name', 'project-management'),
        'singular_name'         => _x('Proyecto', 'Post Type Singular Name', 'project-management'),
        'menu_name'             => __('Gestor de Proyectos', 'project-management'),
        'name_admin_bar'        => __('Proyecto', 'project-management'),
        'archives'              => __('Archivo de Proyectos', 'project-management'),
        'attributes'            => __('Atributos del Proyecto', 'project-management'),
        'parent_item_colon'     => __('Proyecto Padre:', 'project-management'),
        'all_items'             => __('Todos los Proyectos', 'project-management'),
        'add_new_item'          => __('Añadir Nuevo Proyecto', 'project-management'),
        'add_new'               => __('Añadir Nuevo', 'project-management'),
        'new_item'              => __('Nueva', 'project-management'),
        'edit_item'             => __('Editar Proyecto', 'project-management'),
        'update_item'           => __('Actualizar Proyecto', 'project-management'),
        'view_item'             => __('Ver Proyecto', 'project-management'),
        'view_items'            => __('Ver Proyectos', 'project-management'),
        'search_items'          => __('Buscar Proyectos', 'project-management'),
        'not_found'             => __('No se encontraron proyectos', 'project-management'),
        'not_found_in_trash'    => __('No hay proyectos en la papelera', 'project-management'),
        'featured_image'        => __('Imagen destacada', 'project-management'),
        'set_featured_image'    => __('Establecer imagen destacada', 'project-management'),
        'remove_featured_image' => __('Eliminar imagen destacada', 'project-management'),
        'use_featured_image'    => __('Usar como imagen destacada', 'project-management'),
        'insert_into_item'      => __('Insertar en el proyecto', 'project-management'),
        'uploaded_to_this_item' => __('Subido a este proyecto', 'project-management'),
        'items_list'            => __('Lista de proyectos', 'project-management'),
        'items_list_navigation' => __('Navegación de proyectos', 'project-management'),
        'filter_items_list'     => __('Filtrar proyectos', 'project-management'),
    );

    $args = array(
        'label'                 => __('Proyecto', 'project-management'),
        'description'           => __('Sistema de gestión de proyectos', 'project-management'),
        'labels'                => $labels,
        'supports'             => array('title', 'editor', 'thumbnail', 'comments', 'revisions', 'custom-fields'),
        'taxonomies'            => array(),
        'hierarchical'          => false,
        'public'                => true,
        'show_ui'               => true,
        'show_in_menu'          => true,
        'menu_position'         => 25,
        'menu_icon'             => 'dashicons-portfolio',
        'show_in_admin_bar'     => true,
        'show_in_nav_menus'     => true,
        'can_export'            => true,
        'has_archive'           => true,
        'exclude_from_search'   => false,
        'publicly_queryable'    => true,
        'capability_type'       => array('proyecto', 'proyectos'),
        'map_meta_cap'          => true,
        'rewrite'              => array(
            'slug' => 'proyectos',
            'with_front' => true,
            'pages' => true,
            'feeds' => true,
        ),
        'show_in_rest'          => true,
        'rest_base'             => 'proyectos',
        'rest_controller_class' => 'WP_REST_Posts_Controller',
        'rest_namespace'        => 'wp/v2',
    );

    register_post_type('proyecto', $args);
}

// Registrar meta campos para los proyectos
function PM_register_project_meta() {
    // Campo para los participantes del proyecto
    register_post_meta('proyecto', 'participantes', array(
        'type'         => 'array',
        'description'  => 'Lista de participantes del proyecto',
        'single'       => true,
        'show_in_rest' => array(
            'schema' => array(
                'type'  => 'array',
                'items' => array(
                    'type' => 'string',
                ),
            ),
        ),
        'auth_callback' => function() {
            return current_user_can('edit_proyectos') || current_user_can('edit_posts');
        }
    ));

    // Campo para las tareas del proyecto
    register_post_meta('proyecto', 'tareas', array(
        'type'         => 'array',
        'description'  => 'Lista de tareas del proyecto',
        'single'       => true,
        'show_in_rest' => array(
            'schema' => array(
                'type'  => 'array',
                'items' => array(
                    'type' => 'object',
                    'properties' => array(
                        'nombre' => array(
                            'type' => 'string',
                        ),
                        'estado' => array(
                            'type' => 'string',
                            'enum' => array('pendiente', 'en progreso', 'completada'),
                        ),
                    ),
                ),
            ),
        ),
        'auth_callback' => function() {
            return current_user_can('edit_proyectos') || current_user_can('edit_posts');
        }
    ));
}

// =============================================
// FUNCIONES DE SANITIZACIÓN Y AUTORIZACIÓN
// =============================================

// Función para autorizar la actualización de metadatos
function PM_authorize_meta_update($allowed, $meta_key, $post_id, $user_id, $cap, $caps) {
    return current_user_can('edit_proyectos') || current_user_can('edit_posts');
}

// Función para sanitizar los participantes
function PM_sanitize_participantes($meta_value, $meta_key, $object_type) {
    if (!is_array($meta_value)) {
        return array();
    }
    return array_map('sanitize_text_field', $meta_value);
}

// Función para sanitizar las tareas
function PM_sanitize_tareas($meta_value, $meta_key, $object_type) {
    if (!is_array($meta_value)) {
        return array();
    }
    
    return array_map(function($tarea) {
        return array(
            'nombre' => sanitize_text_field($tarea['nombre']),
            'estado' => in_array($tarea['estado'], array('pendiente', 'en progreso', 'completada')) 
                ? $tarea['estado'] 
                : 'pendiente'
        );
    }, $meta_value);
}

// =============================================
// HOOKS Y ACTIVACIÓN/DESACTIVACIÓN
// =============================================

// Registrar hooks para el post type y meta campos
add_action('init', 'PM_register_project_post_type');
add_action('init', 'PM_register_project_meta');

// Registrar hooks para autorización y sanitización
add_filter('auth_post_meta_participantes', 'PM_authorize_meta_update', 10, 6);
add_filter('auth_post_meta_tareas', 'PM_authorize_meta_update', 10, 6);
add_filter('sanitize_post_meta_participantes', 'PM_sanitize_participantes', 10, 3);
add_filter('sanitize_post_meta_tareas', 'PM_sanitize_tareas', 10, 3);

