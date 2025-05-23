<?php
/**
 * Plugin Name: Custom User Registration
 * Description: Añade un endpoint para el registro de usuarios a través de la API REST.
 * Version: 1.0
 * Author: Ramón Moreno Albert
 */

// Evita el acceso directo al archivo.
if ( !defined( 'ABSPATH' ) ) {
    exit;
}

// Registra el endpoint para el registro de usuarios.
add_action('rest_api_init', function () {
    register_rest_route('jwt-auth/v1', '/register', array(
        'methods' => 'POST',
        'callback' => 'custom_user_registration',
        'permission_callback' => '__return_true',
    ));
});

// Añadir endpoint personalizado para obtener usuarios project_user
add_action('rest_api_init', function () {
    register_rest_route('pm/v1', '/users', array(
        'methods' => 'GET',
        'callback' => 'get_project_users',
        'permission_callback' => function() {
            return current_user_can('edit_posts') || current_user_can('view_project_users');
        }
    ));
});

// Función para registrar roles personalizados
function PM_register_custom_roles() {
    global $wp_roles;

    // Asegurarse de que $wp_roles esté inicializado
    if (!isset($wp_roles)) {
        $wp_roles = new WP_Roles();
    }

    // Eliminar roles existentes si existen
    remove_role('super_administrador');
    remove_role('project_admin');
    remove_role('project_user');

    // Registrar los roles personalizados
    $roles = array(
        'super_administrador' => array(
            'name' => 'Super Administrador',
            'capabilities' => array(
                'read' => true,
                'edit_posts' => true,
                'delete_posts' => true,
                'publish_posts' => true,
                'upload_files' => true,
                'edit_published_posts' => true,
                'delete_published_posts' => true,
                'edit_others_posts' => true,
                'delete_others_posts' => true,
                'read_private_posts' => true,
                'edit_private_posts' => true,
                'delete_private_posts' => true,
                'edit_proyectos' => true,
                'edit_others_proyectos' => true,
                'publish_proyectos' => true,
                'read_private_proyectos' => true,
                'delete_proyectos' => true,
                'delete_others_proyectos' => true,
                'delete_published_proyectos' => true,
                'delete_private_proyectos' => true,
                'edit_published_proyectos' => true,
                'edit_private_proyectos' => true,
                'read_proyectos' => true,
                'manage_options' => true,
                'list_users' => true,
                'edit_users' => true,
                'create_users' => true,
                'delete_users' => true,
                'promote_users' => true,
                'remove_users' => true,
                'add_users' => true,
                'manage_categories' => true,
                'moderate_comments' => true,
                'unfiltered_html' => true,
                'export' => true,
                'import' => true,
                'manage_network' => true,
                'manage_sites' => true,
                'manage_network_users' => true,
                'manage_network_themes' => true,
                'manage_network_options' => true,
                'upgrade_network' => true,
                'setup_network' => true,
                'activate_plugins' => true,
                'edit_plugins' => true,
                'install_plugins' => true,
                'update_plugins' => true,
                'delete_plugins' => true,
                'edit_themes' => true,
                'install_themes' => true,
                'update_themes' => true,
                'delete_themes' => true,
                'update_core' => true,
                'edit_dashboard' => true,
                'customize' => true,
                'switch_themes' => true,
                'edit_theme_options' => true,
                'read' => true,
                'level_10' => true,
                'level_9' => true,
                'level_8' => true,
                'level_7' => true,
                'level_6' => true,
                'level_5' => true,
                'level_4' => true,
                'level_3' => true,
                'level_2' => true,
                'level_1' => true,
                'level_0' => true
            )
        ),
        'project_admin' => array(
            'name' => 'Administrador de Proyecto',
            'capabilities' => array(
                'read' => true,
                'edit_posts' => true,
                'delete_posts' => true,
                'publish_posts' => true,
                'upload_files' => true,
                'edit_published_posts' => true,
                'delete_published_posts' => true,
                'edit_others_posts' => true,
                'delete_others_posts' => true,
                'read_private_posts' => true,
                'edit_private_posts' => true,
                'delete_private_posts' => true,
                'edit_proyectos' => true,
                'edit_others_proyectos' => true,
                'publish_proyectos' => true,
                'read_private_proyectos' => true,
                'delete_proyectos' => true,
                'delete_others_proyectos' => true,
                'delete_published_proyectos' => true,
                'delete_private_proyectos' => true,
                'edit_published_proyectos' => true,
                'edit_private_proyectos' => true,
                'read_proyectos' => true,
                'manage_options' => true,
                'list_users' => true,
                'edit_users' => true,
                'create_users' => true,
                'delete_users' => true,
                'promote_users' => true,
                'remove_users' => true,
                'add_users' => true,
                'view_project_users' => true,
                'read_private_users' => true,
                'edit_private_users' => true
            )
        ),
        'project_user' => array(
            'name' => 'Usuario de Proyecto',
            'capabilities' => array(
                'read' => true,
                'edit_posts' => true,
                'delete_posts' => true,
                'publish_posts' => true,
                'upload_files' => true,
                'edit_published_posts' => true,
                'delete_published_posts' => true,
                'edit_proyectos' => true,
                'publish_proyectos' => true,
                'read_private_proyectos' => true,
                'delete_proyectos' => true,
                'delete_published_proyectos' => true,
                'edit_published_proyectos' => true,
                'read_proyectos' => true
            )
        )
    );

    foreach ($roles as $role_key => $role_data) {
        // Asegurarse de que el rol no exista antes de crearlo
        if (!get_role($role_key)) {
            add_role($role_key, $role_data['name'], $role_data['capabilities']);
            error_log('Rol registrado: ' . $role_key);
        }
    }

    // Asegurar que el administrador tenga todas las capacidades
    $admin_role = get_role('administrator');
    if ($admin_role) {
        foreach ($roles['super_administrador']['capabilities'] as $cap => $grant) {
            $admin_role->add_cap($cap);
        }
        error_log('Capacidades añadidas al rol administrador');
    }
}

// Añadir un filtro para asegurar que los roles se registren al cargar WordPress
add_action('init', 'PM_register_custom_roles', 0);

// Registrar el hook para la activación del plugin
register_activation_hook(PM_PLUGIN_DIR . '../Project_Management.php', 'PM_register_custom_roles');

// Función para limpiar roles al desactivar el plugin
function PM_remove_custom_roles() {
    remove_role('super_administrador');
    remove_role('project_admin');
    remove_role('project_user');
}

// Registrar el hook para la desactivación del plugin
register_deactivation_hook(PM_PLUGIN_DIR . '../Project_Management.php', 'PM_remove_custom_roles');

// Añadir los roles a la lista de roles disponibles
add_filter('editable_roles', function($roles) {
    $custom_roles = array(
        'super_administrador' => array(
            'name' => 'Super Administrador',
            'capabilities' => array(
                'read' => true,
                'edit_posts' => true,
                'delete_posts' => true,
                'publish_posts' => true,
                'upload_files' => true,
                'edit_published_posts' => true,
                'delete_published_posts' => true,
                'edit_others_posts' => true,
                'delete_others_posts' => true,
                'read_private_posts' => true,
                'edit_private_posts' => true,
                'delete_private_posts' => true,
                'edit_proyectos' => true,
                'edit_others_proyectos' => true,
                'publish_proyectos' => true,
                'read_private_proyectos' => true,
                'delete_proyectos' => true,
                'delete_others_proyectos' => true,
                'delete_published_proyectos' => true,
                'delete_private_proyectos' => true,
                'edit_published_proyectos' => true,
                'edit_private_proyectos' => true,
                'read_proyectos' => true,
                'manage_options' => true,
                'list_users' => true,
                'edit_users' => true,
                'create_users' => true,
                'delete_users' => true,
                'promote_users' => true,
                'remove_users' => true,
                'add_users' => true
            )
        ),
        'project_admin' => array(
            'name' => 'Administrador de Proyecto',
            'capabilities' => array(
                'read' => true,
                'edit_posts' => true,
                'delete_posts' => true,
                'publish_posts' => true,
                'upload_files' => true,
                'edit_published_posts' => true,
                'delete_published_posts' => true,
                'edit_others_posts' => true,
                'delete_others_posts' => true,
                'read_private_posts' => true,
                'edit_private_posts' => true,
                'delete_private_posts' => true,
                'edit_proyectos' => true,
                'edit_others_proyectos' => true,
                'publish_proyectos' => true,
                'read_private_proyectos' => true,
                'delete_proyectos' => true,
                'delete_others_proyectos' => true,
                'delete_published_proyectos' => true,
                'delete_private_proyectos' => true,
                'edit_published_proyectos' => true,
                'edit_private_proyectos' => true,
                'read_proyectos' => true,
                'manage_options' => true,
                'list_users' => true,
                'edit_users' => true,
                'create_users' => true,
                'delete_users' => true,
                'promote_users' => true,
                'remove_users' => true,
                'add_users' => true
            )
        ),
        'project_user' => array(
            'name' => 'Usuario de Proyecto',
            'capabilities' => array(
                'read' => true,
                'edit_posts' => true,
                'delete_posts' => true,
                'publish_posts' => true,
                'upload_files' => true,
                'edit_published_posts' => true,
                'delete_published_posts' => true,
                'edit_proyectos' => true,
                'publish_proyectos' => true,
                'read_private_proyectos' => true,
                'delete_proyectos' => true,
                'delete_published_proyectos' => true,
                'edit_published_proyectos' => true,
                'read_proyectos' => true
            )
        )
    );

    foreach ($custom_roles as $role_key => $role_data) {
        if (!isset($roles[$role_key])) {
            $roles[$role_key] = $role_data;
        }
    }

    return $roles;
});

// Añadir el campo first_login a los usuarios
add_action('user_register', function($user_id) {
    update_user_meta($user_id, 'first_login', true);
});

// Añadir el campo first_login a la respuesta de la API
add_filter('rest_prepare_user', function($response, $user, $request) {
    $first_login = get_user_meta($user->ID, 'first_login', true);
    $response->data['meta'] = array(
        'first_login' => $first_login
    );
    return $response;
}, 10, 3);

// Prevenir la asignación del rol 'subscriber' por defecto
add_filter('user_register', function($user_id) {
    $user = new WP_User($user_id);
    if (in_array('subscriber', $user->roles)) {
        $user->remove_role('subscriber');
    }
});

// Modificar la función de registro de usuarios
function custom_user_registration($request) {
    $username = $request->get_param('username');
    $email = $request->get_param('email');
    $password = $request->get_param('password');
    $role = $request->get_param('role');

    // Validar que el rol sea uno de los permitidos
    $allowed_roles = array('super_administrador', 'project_admin', 'project_user');
    if (!in_array($role, $allowed_roles)) {
        return new WP_Error('invalid_role', 'Rol no válido', array('status' => 400));
    }

    // Verificar si el usuario actual tiene permisos para crear usuarios
    $current_user = wp_get_current_user();
    if (!in_array('super_administrador', $current_user->roles)) {
        return new WP_Error('insufficient_permissions', 'No tienes permisos para crear usuarios', array('status' => 403));
    }

    // Verificar si el usuario ya existe
    if (username_exists($username) || email_exists($email)) {
        return new WP_Error('user_exists', 'El usuario o email ya existe', array('status' => 400));
    }

    // Crear el usuario sin rol específico primero
    $user_id = wp_create_user($username, $password, $email);
    
    if (is_wp_error($user_id)) {
        return $user_id;
    }

    // Obtener el usuario
    $user = new WP_User($user_id);
    
    // Eliminar todos los roles existentes
    $user->set_role('');
    
    // Obtener el objeto del rol
    $role_obj = get_role($role);
    if (!$role_obj) {
        // Si el rol no existe, intentar registrarlo nuevamente
        PM_register_custom_roles();
        $role_obj = get_role($role);
    }

    if ($role_obj) {
        // Asignar todas las capacidades del rol al usuario
        foreach ($role_obj->capabilities as $cap => $grant) {
            $user->add_cap($cap, $grant);
        }
        
        // Asignar el rol específico
        $user->add_role($role);
        
        // Verificar que el rol se haya asignado correctamente
        if (!in_array($role, $user->roles)) {
            // Si aún no se asignó, intentar asignarlo directamente
            $user->set_role($role);
        }
    } else {
        // Si no se pudo obtener el rol, eliminar el usuario y devolver error
        wp_delete_user($user_id);
        return new WP_Error('role_error', 'No se pudo asignar el rol al usuario', array('status' => 500));
    }

    // Establecer first_login como true
    update_user_meta($user_id, 'first_login', true);

    // Obtener el usuario creado con sus datos actualizados
    $user_data = get_userdata($user_id);
    
    // Registrar en el log para depuración
    error_log('Usuario creado: ' . $username . ' con rol: ' . $role);
    error_log('Roles asignados: ' . print_r($user_data->roles, true));
    error_log('Capacidades asignadas: ' . print_r($user_data->allcaps, true));
    
    return array(
        'id' => $user_id,
        'username' => $user_data->user_login,
        'email' => $user_data->user_email,
        'roles' => $user_data->roles,
        'capabilities' => $user_data->allcaps,
        'first_login' => true
    );
}

// Añadir las capacidades del usuario a la respuesta de la API
add_filter('rest_prepare_user', function ($response, $user, $request) {
    $response->data['roles'] = $user->roles;
    $response->data['capabilities'] = $user->allcaps;
    return $response;
}, 10, 3);

// Añadir las capacidades del usuario a la respuesta del token
add_filter('jwt_auth_token_before_dispatch', function ($data, $user) {
    $user_data = get_userdata($user->ID);
    $data['roles'] = $user_data->roles;
    $data['capabilities'] = $user_data->allcaps;
    return $data;
}, 10, 2);

// Modificar la consulta de usuarios en la API REST para incluir a todos los usuarios
add_filter('rest_user_query', function ($args, $request) {
    // Incluir todos los usuarios, incluso los que no tienen publicaciones
    $args['has_published_posts'] = false;
    return $args;
}, 10, 2);

// Añadir endpoint para cambiar la contraseña
add_action('rest_api_init', function () {
    register_rest_route('jwt-auth/v1', '/change-password', array(
        'methods' => 'POST',
        'callback' => 'change_user_password',
        'permission_callback' => function() {
            return is_user_logged_in();
        }
    ));
});

function change_user_password($request) {
    $user_id = get_current_user_id();
    $current_password = $request['current_password'];
    $new_password = $request['new_password'];

    $user = get_user_by('id', $user_id);
    if (!$user || !wp_check_password($current_password, $user->data->user_pass, $user_id)) {
        return new WP_Error('invalid_password', 'La contraseña actual es incorrecta.', array('status' => 400));
    }

    wp_set_password($new_password, $user_id);
    update_user_meta($user_id, 'first_login', false);

    return array('success' => true, 'message' => 'Contraseña actualizada exitosamente.');
}

// Función para obtener usuarios project_user
function get_project_users() {
    $users = get_users(array('role' => 'project_user'));
    $formatted_users = array();
    
    foreach ($users as $user) {
        $formatted_users[] = array(
            'id' => $user->ID,
            'name' => $user->display_name,
            'email' => $user->user_email,
            'roles' => $user->roles
        );
    }
    
    return rest_ensure_response($formatted_users);
}