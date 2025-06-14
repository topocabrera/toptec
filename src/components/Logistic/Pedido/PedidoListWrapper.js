import { useLocation } from "react-router-dom";
import PedidoList from "./pedidoList"; // suponiendo que tu clase está en este archivo

const PedidoListWrapper = () => {
    const location = useLocation();

    return <PedidoList location={location} />;
};

export default PedidoListWrapper;
