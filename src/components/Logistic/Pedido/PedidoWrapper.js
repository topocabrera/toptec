import { useParams } from "react-router-dom";
import Pedido from "./pedido"; // suponiendo que tu clase está en este archivo

const PedidoWrapper = () => {
    const params = useParams();
    return <Pedido match={{ params }} />;
};

export default PedidoWrapper;
