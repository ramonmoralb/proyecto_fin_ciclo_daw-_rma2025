<?php
/**
 * Plugin Name: Project Management
 * Description: Plugin para gestión de proyectos
 * Version: 1.0
 * Author: Ramon
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

// Incluir archivos necesarios
require_once PM_PLUGIN_DIR . 'includes/custom-post-types.php';
require_once PM_PLUGIN_DIR . 'includes/api-endpoints.php';

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
        'menu_position'         => 6,
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
            return current_user_can('read_proyectos');
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
                            'enum' => array('pendiente', 'en_progreso', 'completada'),
                        ),
                        'descripcion' => array(
                            'type' => 'string',
                        ),
                        'prioridad' => array(
                            'type' => 'string',
                            'enum' => array('baja', 'media', 'alta'),
                        ),
                        'asignado' => array(
                            'type' => 'string',
                        ),
                    ),
                ),
            ),
        ),
        'auth_callback' => function() {
            return current_user_can('read_proyectos');
        }
    ));
}

// =============================================
// FUNCIONES DE SANITIZACIÓN Y AUTORIZACIÓN
// =============================================

// Función para autorizar la actualización de metadatos
function PM_authorize_meta_update($allowed, $meta_key, $post_id, $user_id, $cap, $caps) {
    // Si el usuario es administrador o project_admin, permitir todo
    if (current_user_can('administrator') || current_user_can('project_admin')) {
        return true;
    }

    // Si es project_user, verificar si es participante del proyecto
    if (current_user_can('project_user')) {
        $post = get_post($post_id);
        if ($post && $post->post_type === 'proyecto') {
            $participantes = get_post_meta($post_id, 'participantes', true);
            if (is_array($participantes) && in_array($user_id, $participantes)) {
                return true;
            }
        }
    }

    return $allowed;
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
            'nombre' => isset($tarea['nombre']) ? sanitize_text_field($tarea['nombre']) : '',
            'estado' => (isset($tarea['estado']) && in_array($tarea['estado'], array('pendiente', 'en_progreso', 'completada')))
                ? $tarea['estado']
                : 'pendiente',
            'descripcion' => isset($tarea['descripcion']) ? sanitize_text_field($tarea['descripcion']) : '',
            'prioridad' => (isset($tarea['prioridad']) && in_array($tarea['prioridad'], array('baja', 'media', 'alta')))
                ? $tarea['prioridad']
                : 'media',
            'asignado' => isset($tarea['asignado']) ? sanitize_text_field($tarea['asignado']) : '',
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

// Función para actualizar los metadatos de los usuarios cuando se crea o actualiza un proyecto
function PM_update_user_projects($post_id, $post, $update) {
    // Solo procesar si es un proyecto
    if ($post->post_type !== 'proyecto') {
        return;
    }

    error_log('Actualizando proyectos para el proyecto ID: ' . $post_id);

    // Obtener los participantes del proyecto
    $participantes = get_post_meta($post_id, 'participantes', true);
    error_log('Participantes del proyecto: ' . print_r($participantes, true));

    if (!is_array($participantes)) {
        $participantes = array();
    }

    // Obtener todos los usuarios con rol project_user
    $users = get_users(array('role' => 'project_user'));
    error_log('Usuarios project_user encontrados: ' . count($users));
    
    foreach ($users as $user) {
        error_log('Procesando usuario ID: ' . $user->ID);
        
        // Obtener los proyectos actuales del usuario
        $user_projects = get_user_meta($user->ID, 'proyectos_asignados', true);
        if (!is_array($user_projects)) {
            $user_projects = array();
        }
        error_log('Proyectos actuales del usuario: ' . print_r($user_projects, true));

        // Verificar si el usuario es participante
        $is_participant = false;
        foreach ($participantes as $participante) {
            if (isset($participante['id']) && intval($participante['id']) === intval($user->ID)) {
                $is_participant = true;
                error_log('Usuario ' . $user->ID . ' es participante del proyecto');
                break;
            }
        }

        if ($is_participant) {
            // Agregar el proyecto si no existe
            $project_exists = false;
            foreach ($user_projects as $project) {
                if (isset($project['id']) && intval($project['id']) === intval($post_id)) {
                    $project_exists = true;
                    error_log('Proyecto ya existe para el usuario ' . $user->ID);
                    break;
                }
            }

            if (!$project_exists) {
                $new_project = array(
                    'id' => $post_id,
                    'title' => $post->post_title,
                    'link' => get_permalink($post_id)
                );
                $user_projects[] = $new_project;
                error_log('Agregando nuevo proyecto al usuario ' . $user->ID . ': ' . print_r($new_project, true));
                
                // Actualizar el meta del usuario
                $update_result = update_user_meta($user->ID, 'proyectos_asignados', $user_projects);
                error_log('Resultado de actualización para usuario ' . $user->ID . ': ' . ($update_result ? 'exitoso' : 'fallido'));
                
                // Verificar que se actualizó correctamente
                $updated_projects = get_user_meta($user->ID, 'proyectos_asignados', true);
                error_log('Proyectos actualizados del usuario: ' . print_r($updated_projects, true));
            }
        } else {
            // Remover el proyecto si el usuario ya no es participante
            $original_count = count($user_projects);
            $user_projects = array_filter($user_projects, function($project) use ($post_id) {
                return isset($project['id']) && intval($project['id']) !== intval($post_id);
            });
            
            if (count($user_projects) !== $original_count) {
                error_log('Removiendo proyecto del usuario ' . $user->ID);
                update_user_meta($user->ID, 'proyectos_asignados', $user_projects);
            }
        }
    }
}

// Agregar hooks para la creación y actualización de proyectos
add_action('wp_insert_post', 'PM_update_user_projects', 10, 3);
add_action('post_updated', 'PM_update_user_projects', 10, 3);

// Función para limpiar los metadatos de los usuarios cuando se elimina un proyecto
function PM_cleanup_user_projects($post_id) {
    $post = get_post($post_id);
    if ($post->post_type !== 'proyecto') {
        return;
    }

    error_log('Limpiando proyectos para el proyecto eliminado ID: ' . $post_id);

    $users = get_users(array('role' => 'project_user'));
    foreach ($users as $user) {
        $user_projects = get_user_meta($user->ID, 'proyectos_asignados', true);
        if (is_array($user_projects)) {
            $original_count = count($user_projects);
            $user_projects = array_filter($user_projects, function($project) use ($post_id) {
                return isset($project['id']) && intval($project['id']) !== intval($post_id);
            });
            
            if (count($user_projects) !== $original_count) {
                error_log('Removiendo proyecto eliminado del usuario ' . $user->ID);
                update_user_meta($user->ID, 'proyectos_asignados', $user_projects);
            }
        }
    }
}

// Agregar hook para la eliminación de proyectos
add_action('before_delete_post', 'PM_cleanup_user_projects');

// Registrar endpoint personalizado para actualizar tareas
add_action('rest_api_init', function () {
    register_rest_route('pm/v1', '/tasks/(?P<project_id>\d+)/update', array(
        'methods' => 'POST',
        'callback' => 'PM_update_task_status',
        'permission_callback' => function() {
            return is_user_logged_in();
        },
        'args' => array(
            'project_id' => array(
                'required' => true,
                'type' => 'integer'
            ),
            'task_name' => array(
                'required' => true,
                'type' => 'string'
            ),
            'new_status' => array(
                'required' => true,
                'type' => 'string',
                'enum' => array('pendiente', 'en_progreso', 'completada')
            )
        )
    ));
});

// Función para actualizar el estado de una tarea
function PM_update_task_status($request) {
    $project_id = $request['project_id'];
    $task_name = $request['task_name'];
    $new_status = $request['new_status'];
    $current_user = wp_get_current_user();

    error_log('Intentando actualizar tarea:');
    error_log('Project ID: ' . $project_id);
    error_log('Task Name: ' . $task_name);
    error_log('New Status: ' . $new_status);
    error_log('Current User ID: ' . $current_user->ID);
    error_log('Current User Roles: ' . print_r($current_user->roles, true));

    // Verificar permisos
    $participantes = get_post_meta($project_id, 'participantes', true);
    if (!is_array($participantes)) {
        $participantes = array();
    }
    error_log('Participantes del proyecto: ' . print_r($participantes, true));

    // Verificar si el usuario tiene permiso
    $has_permission = false;
    
    // Verificar si es administrador o project_admin
    if (in_array('administrator', $current_user->roles) || 
        in_array('project_admin', $current_user->roles) || 
        in_array('super_administrador', $current_user->roles)) {
        $has_permission = true;
        error_log('Usuario tiene permisos por rol de administrador');
    }
    
    // Verificar si es participante
    if (in_array($current_user->ID, $participantes)) {
        $has_permission = true;
        error_log('Usuario tiene permisos por ser participante');
    }

    if (!$has_permission) {
        error_log('Usuario no tiene permisos para actualizar la tarea');
        return new WP_Error('rest_forbidden', 'No tienes permiso para actualizar esta tarea', array('status' => 403));
    }

    // Obtener las tareas actuales
    $tareas = get_post_meta($project_id, 'tareas', true);
    if (!is_array($tareas)) {
        error_log('No se encontraron tareas en el proyecto');
        return new WP_Error('rest_error', 'No se encontraron tareas en el proyecto', array('status' => 404));
    }
    error_log('Tareas actuales: ' . print_r($tareas, true));

    // Actualizar la tarea
    $tarea_encontrada = false;
    foreach ($tareas as &$tarea) {
        if ($tarea['nombre'] === $task_name) {
            $tarea['estado'] = $new_status;
            $tarea['lastUpdatedBy'] = $current_user->display_name;
            $tarea['lastUpdatedAt'] = current_time('mysql');
            $tarea_encontrada = true;
            error_log('Tarea actualizada: ' . print_r($tarea, true));
            break;
        }
    }

    if (!$tarea_encontrada) {
        error_log('Tarea no encontrada');
        return new WP_Error('rest_error', 'Tarea no encontrada', array('status' => 404));
    }

    // Guardar las tareas actualizadas
    $result = update_post_meta($project_id, 'tareas', $tareas);
    if (!$result) {
        error_log('Error al guardar las tareas actualizadas');
        return new WP_Error('rest_error', 'Error al actualizar la tarea', array('status' => 500));
    }

    error_log('Tarea actualizada exitosamente');
    return array(
        'success' => true,
        'message' => 'Tarea actualizada correctamente',
        'tareas' => $tareas
    );
}

// Activar el plugin
register_activation_hook(__FILE__, 'pm_activate');
function pm_activate() {
    // Flush rewrite rules
    flush_rewrite_rules();
}

// Desactivar el plugin
register_deactivation_hook(__FILE__, 'pm_deactivate');
function pm_deactivate() {
    // Flush rewrite rules
    flush_rewrite_rules();
}

