// Endpoint para Pedidos
function register_orders_endpoint() {
    register_rest_route('pm/v1', '/pedidos', array(
        'methods' => 'GET',
        'callback' => 'get_orders',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));

    register_rest_route('pm/v1', '/pedidos', array(
        'methods' => 'POST',
        'callback' => 'create_order',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));

    register_rest_route('pm/v1', '/pedidos/(?P<id>\d+)', array(
        'methods' => 'PUT',
        'callback' => 'update_order',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));

    register_rest_route('pm/v1', '/pedidos/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'delete_order',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
}
add_action('rest_api_init', 'register_orders_endpoint');

function get_orders($request) {
    $args = array(
        'post_type' => 'pedidos',
        'posts_per_page' => -1,
        'post_status' => 'publish'
    );

    $orders = get_posts($args);
    $formatted_orders = array();

    foreach ($orders as $order) {
        $cliente = get_post($order->meta->cliente_id);
        $productos = $order->meta->productos;

        $formatted_orders[] = array(
            'id' => $order->ID,
            'title' => $order->post_title,
            'cliente' => array(
                'id' => $cliente->ID,
                'nombre' => $cliente->post_title
            ),
            'productos' => $productos,
            'estado' => $order->meta->estado,
            'total' => $order->meta->total,
            'fecha' => $order->post_date
        );
    }

    return rest_ensure_response($formatted_orders);
}

function create_order($request) {
    $params = $request->get_params();
    
    $order_data = array(
        'post_title' => $params['title'],
        'post_type' => 'pedidos',
        'post_status' => 'publish'
    );

    $order_id = wp_insert_post($order_data);

    if (is_wp_error($order_id)) {
        return new WP_Error('create_failed', 'Error al crear el pedido', array('status' => 500));
    }

    update_post_meta($order_id, 'cliente_id', $params['cliente_id']);
    update_post_meta($order_id, 'productos', $params['productos']);
    update_post_meta($order_id, 'estado', $params['estado'] || 'pendiente');
    update_post_meta($order_id, 'total', $params['total']);

    return rest_ensure_response(array(
        'id' => $order_id,
        'message' => 'Pedido creado exitosamente'
    ));
}

function update_order($request) {
    $order_id = $request['id'];
    $params = $request->get_params();

    $order_data = array(
        'ID' => $order_id,
        'post_title' => $params['title']
    );

    $updated = wp_update_post($order_data);

    if (is_wp_error($updated)) {
        return new WP_Error('update_failed', 'Error al actualizar el pedido', array('status' => 500));
    }

    update_post_meta($order_id, 'cliente_id', $params['cliente_id']);
    update_post_meta($order_id, 'productos', $params['productos']);
    update_post_meta($order_id, 'estado', $params['estado']);
    update_post_meta($order_id, 'total', $params['total']);

    return rest_ensure_response(array(
        'id' => $order_id,
        'message' => 'Pedido actualizado exitosamente'
    ));
}

function delete_order($request) {
    $order_id = $request['id'];
    $deleted = wp_delete_post($order_id, true);

    if (!$deleted) {
        return new WP_Error('delete_failed', 'Error al eliminar el pedido', array('status' => 500));
    }

    return rest_ensure_response(array(
        'message' => 'Pedido eliminado exitosamente'
    ));
} 