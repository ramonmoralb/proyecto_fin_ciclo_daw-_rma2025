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

// Función para registrar roles personalizados
function PM_register_custom_roles() {
    // Eliminar roles existentes si existen
    remove_role('project_admin');
    remove_role('project_user');

    // Añadir rol de administrador de proyecto con todas las capacidades
    add_role('project_admin', 'Administrador de Proyecto', array(
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
    ));

    // Añadir rol de usuario de proyecto con capacidades básicas
    add_role('project_user', 'Usuario de Proyecto', array(
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
    ));

    // Asegurar que el administrador tenga todas las capacidades
    $admin_role = get_role('administrator');
    if ($admin_role) {
        $admin_role->add_cap('read');
        $admin_role->add_cap('edit_posts');
        $admin_role->add_cap('delete_posts');
        $admin_role->add_cap('publish_posts');
        $admin_role->add_cap('upload_files');
        $admin_role->add_cap('edit_published_posts');
        $admin_role->add_cap('delete_published_posts');
        $admin_role->add_cap('edit_others_posts');
        $admin_role->add_cap('delete_others_posts');
        $admin_role->add_cap('read_private_posts');
        $admin_role->add_cap('edit_private_posts');
        $admin_role->add_cap('delete_private_posts');
        $admin_role->add_cap('edit_proyectos');
        $admin_role->add_cap('edit_others_proyectos');
        $admin_role->add_cap('publish_proyectos');
        $admin_role->add_cap('read_private_proyectos');
        $admin_role->add_cap('delete_proyectos');
        $admin_role->add_cap('delete_others_proyectos');
        $admin_role->add_cap('delete_published_proyectos');
        $admin_role->add_cap('delete_private_proyectos');
        $admin_role->add_cap('edit_published_proyectos');
        $admin_role->add_cap('edit_private_proyectos');
        $admin_role->add_cap('read_proyectos');
        $admin_role->add_cap('manage_options');
        $admin_role->add_cap('list_users');
        $admin_role->add_cap('edit_users');
        $admin_role->add_cap('create_users');
        $admin_role->add_cap('delete_users');
        $admin_role->add_cap('promote_users');
        $admin_role->add_cap('remove_users');
        $admin_role->add_cap('add_users');
    }
}

// Registrar el hook para la activación del plugin
register_activation_hook(PM_PLUGIN_DIR . '../Project_Management.php', 'PM_register_custom_roles');

// Función para limpiar roles al desactivar el plugin
function PM_remove_custom_roles() {
    remove_role('project_admin');
    remove_role('project_user');
}

// Registrar el hook para la desactivación del plugin
register_deactivation_hook(PM_PLUGIN_DIR . '../Project_Management.php', 'PM_remove_custom_roles');

function custom_user_registration($request) {
    $username = sanitize_text_field($request['username']);
    $password = sanitize_text_field($request['password']);
    $email = sanitize_email($request['email']);
    $role = sanitize_text_field($request['role']);
    $first_name = sanitize_text_field($request['first_name']);
    $last_name = sanitize_text_field($request['last_name']);

    // Lista de roles permitidos
    $allowed_roles = array('project_user', 'project_admin');

    if (!in_array($role, $allowed_roles)) {
        return new WP_Error('invalid_role', 'El rol proporcionado no es válido.', array('status' => 400));
    }

    if (username_exists($username)) {
        return new WP_Error('user_exists', 'El nombre de usuario ya está en uso.', array('status' => 400));
    }

    $user_id = wp_create_user($username, $password, $email);

    if (is_wp_error($user_id)) {
        return new WP_Error('registration_failed', 'Error al registrar el usuario.', array('status' => 500));
    }

    // Asignar rol al usuario
    $user = new WP_User($user_id);
    $user->set_role($role);

    // Actualizar meta datos del usuario
    if (!empty($first_name)) {
        update_user_meta($user_id, 'first_name', $first_name);
    }
    if (!empty($last_name)) {
        update_user_meta($user_id, 'last_name', $last_name);
    }

    return array('success' => true, 'message' => 'Usuario registrado exitosamente.');
}

// Añadir los roles del usuario a la respuesta del endpoint /users/me
add_filter('rest_prepare_user', function ($response, $user, $request) {
    $response->data['roles'] = $user->roles; // Añadir roles a la respuesta
    return $response;
}, 10, 3);

// Añadir los roles del usuario a la respuesta del token
add_filter('jwt_auth_token_before_dispatch', function ($data, $user) {
    $user_data = get_userdata($user->ID);
    $data['roles'] = $user_data->roles; // Añadir roles a la respuesta del token
    return $data;
}, 10, 2);

// Modificar la consulta de usuarios en la API REST para incluir a todos los usuarios
add_filter('rest_user_query', function ($args, $request) {
    // Incluir todos los usuarios, incluso los que no tienen publicaciones
    $args['has_published_posts'] = false;
    return $args;
}, 10, 2);