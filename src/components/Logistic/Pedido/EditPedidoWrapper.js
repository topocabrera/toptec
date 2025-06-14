import { useParams } from "react-router-dom";
import EditPedido from "./editPedido"; // suponiendo que tu clase está en este archivo

const EditPedidoWrapper = () => {
    const params = useParams();
    return <EditPedido match={{ params }} />;
};

export default EditPedidoWrapper;
