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

// Función para registrar los roles personalizados.
function PM_register_custom_roles() {
    // Rol para el administrador del proyecto
    add_role(
        'project_admin',
        __('Administrador de Proyectos', 'project-management'),
        array(
            'read' => true,
            'edit_posts' => true,
            'delete_posts' => true,
            'manage_categories' => true,
            'edit_others_posts' => true,
            'publish_posts' => true,
        )
    );

    // Rol para los usuarios de proyectos
    add_role(
        'project_user',
        __('Usuario de Proyectos', 'project-management'),
        array(
            'read' => true,
            'edit_posts' => false,
            'delete_posts' => false,
        )
    );
}
add_action('init', 'PM_register_custom_roles');

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