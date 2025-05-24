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

// Registrar Custom Post Type 'Pedidos'
function register_orders_post_type() {
    $labels = array(
        'name'                  => _x('Pedidos', 'Post Type General Name', 'project-management'),
        'singular_name'         => _x('Pedido', 'Post Type Singular Name', 'project-management'),
        'menu_name'             => __('Pedidos', 'project-management'),
        'name_admin_bar'        => __('Pedido', 'project-management'),
        'archives'              => __('Archivo de Pedidos', 'project-management'),
        'attributes'            => __('Atributos del Pedido', 'project-management'),
        'parent_item_colon'     => __('Pedido Padre:', 'project-management'),
        'all_items'             => __('Todos los Pedidos', 'project-management'),
        'add_new_item'          => __('Añadir Nuevo Pedido', 'project-management'),
        'add_new'               => __('Añadir Nuevo', 'project-management'),
        'new_item'              => __('Nuevo Pedido', 'project-management'),
        'edit_item'             => __('Editar Pedido', 'project-management'),
        'update_item'           => __('Actualizar Pedido', 'project-management'),
        'view_item'             => __('Ver Pedido', 'project-management'),
        'view_items'            => __('Ver Pedidos', 'project-management'),
        'search_items'          => __('Buscar Pedidos', 'project-management'),
        'not_found'             => __('No se encontraron pedidos', 'project-management'),
        'not_found_in_trash'    => __('No hay pedidos en la papelera', 'project-management'),
    );

    $args = array(
        'label'                 => __('Pedido', 'project-management'),
        'description'           => __('Sistema de gestión de pedidos', 'project-management'),
        'labels'                => $labels,
        'supports'              => array('title', 'custom-fields'),
        'hierarchical'          => false,
        'public'                => true,
        'show_ui'               => true,
        'show_in_menu'          => true,
        'menu_position'         => 5,
        'menu_icon'             => 'dashicons-cart',
        'show_in_admin_bar'     => true,
        'show_in_nav_menus'     => true,
        'can_export'            => true,
        'has_archive'           => true,
        'exclude_from_search'   => false,
        'publicly_queryable'    => true,
        'capability_type'       => 'post',
        'show_in_rest'          => true,
        'rest_base'             => 'pedidos',
        'rest_controller_class' => 'WP_REST_Posts_Controller',
    );

    register_post_type('pedidos', $args);

    // Registrar meta campos para pedidos
    register_post_meta('pedidos', 'cliente_id', array(
        'type'         => 'string',
        'description'  => 'ID del cliente',
        'single'       => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));

    register_post_meta('pedidos', 'productos', array(
        'type'         => 'array',
        'description'  => 'Lista de productos del pedido',
        'single'       => true,
        'show_in_rest' => array(
            'schema' => array(
                'type'  => 'array',
                'items' => array(
                    'type' => 'object',
                    'properties' => array(
                        'producto_id' => array(
                            'type' => 'string'
                        ),
                        'cantidad' => array(
                            'type' => 'integer'
                        ),
                        'precio_unitario' => array(
                            'type' => 'number'
                        ),
                        'subtotal' => array(
                            'type' => 'number'
                        )
                    )
                )
            )
        ),
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));

    register_post_meta('pedidos', 'total', array(
        'type'         => 'number',
        'description'  => 'Total del pedido',
        'single'       => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));

    register_post_meta('pedidos', 'estado', array(
        'type'         => 'string',
        'description'  => 'Estado del pedido',
        'single'       => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
}

// Registrar los Custom Post Types
add_action('init', 'register_cliente_post_type');
add_action('init', 'register_producto_post_type');
add_action('init', 'register_orders_post_type');

// Flush rewrite rules al activar el plugin
register_activation_hook(PM_PLUGIN_DIR . 'Project_Management.php', function() {
    register_cliente_post_type();
    register_producto_post_type();
    register_orders_post_type();
    flush_rewrite_rules();
});

// Flush rewrite rules al desactivar el plugin
register_deactivation_hook(PM_PLUGIN_DIR . 'Project_Management.php', function() {
    flush_rewrite_rules();
}); 