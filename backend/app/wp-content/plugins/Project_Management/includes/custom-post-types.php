<?php
/**
 * Registro de Custom Post Types para Clientes y Productos
 */

// Función para verificar permisos de la API REST
function check_rest_api_permissions() {
    return current_user_can('manage_options') || in_array('super_administrador', wp_get_current_user()->roles);
}

// Registrar Custom Post Type para Clientes
function register_cliente_post_type() {
    $labels = array(
        'name'               => 'Clientes',
        'singular_name'      => 'Cliente',
        'menu_name'          => 'Clientes',
        'add_new'            => 'Añadir Nuevo',
        'add_new_item'       => 'Añadir Nuevo Cliente',
        'edit_item'          => 'Editar Cliente',
        'new_item'           => 'Nuevo Cliente',
        'view_item'          => 'Ver Cliente',
        'search_items'       => 'Buscar Clientes',
        'not_found'          => 'No se encontraron clientes',
        'not_found_in_trash' => 'No se encontraron clientes en la papelera'
    );

    $args = array(
        'labels'              => $labels,
        'public'              => true,
        'has_archive'         => true,
        'publicly_queryable'  => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'query_var'          => true,
        'rewrite'            => array('slug' => 'clientes'),
        'capability_type'    => 'post',
        'supports'           => array('title', 'editor', 'author'),
        'show_in_rest'       => true,
        'rest_base'          => 'clientes',
        'rest_controller_class' => 'WP_REST_Posts_Controller'
    );

    register_post_type('cliente', $args);

    // Registrar campos personalizados para Clientes
    register_post_meta('cliente', 'email', array(
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'sanitize_callback' => 'sanitize_email'
    ));

    register_post_meta('cliente', 'telefono', array(
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'sanitize_callback' => 'sanitize_text_field'
    ));

    register_post_meta('cliente', 'direccion', array(
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'sanitize_callback' => 'sanitize_text_field'
    ));
}

// Registrar Custom Post Type para Productos
function register_producto_post_type() {
    $labels = array(
        'name'               => 'Productos',
        'singular_name'      => 'Producto',
        'menu_name'          => 'Productos',
        'add_new'            => 'Añadir Nuevo',
        'add_new_item'       => 'Añadir Nuevo Producto',
        'edit_item'          => 'Editar Producto',
        'new_item'           => 'Nuevo Producto',
        'view_item'          => 'Ver Producto',
        'search_items'       => 'Buscar Productos',
        'not_found'          => 'No se encontraron productos',
        'not_found_in_trash' => 'No se encontraron productos en la papelera'
    );

    $args = array(
        'labels'              => $labels,
        'public'              => true,
        'has_archive'         => true,
        'publicly_queryable'  => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'query_var'          => true,
        'rewrite'            => array('slug' => 'productos'),
        'capability_type'    => 'post',
        'supports'           => array('title', 'editor', 'author'),
        'show_in_rest'       => true,
        'rest_base'          => 'productos',
        'rest_controller_class' => 'WP_REST_Posts_Controller'
    );

    register_post_type('producto', $args);

    // Registrar campos personalizados para Productos
    register_post_meta('producto', 'precio', array(
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'sanitize_callback' => 'sanitize_text_field'
    ));

    register_post_meta('producto', 'stock', array(
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'sanitize_callback' => 'sanitize_text_field'
    ));
}

// Registrar los Custom Post Types
add_action('init', 'register_cliente_post_type');
add_action('init', 'register_producto_post_type');

// Flush rewrite rules al activar el plugin
register_activation_hook(PM_PLUGIN_DIR . 'Project_Management.php', function() {
    register_cliente_post_type();
    register_producto_post_type();
    flush_rewrite_rules();
});

// Flush rewrite rules al desactivar el plugin
register_deactivation_hook(PM_PLUGIN_DIR . 'Project_Management.php', function() {
    flush_rewrite_rules();
}); 